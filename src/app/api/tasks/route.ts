import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applySessionCookie, ensureSession } from "@/lib/session";

// GET all tasks from MySQL
export async function GET() {
  try {
    const { sessionId, isNew } = await ensureSession();

    const tasks = await prisma.task.findMany({
      where: { sessionId },
      orderBy: { due: "asc" },
    });

    const res = NextResponse.json(tasks);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST a new task to MySQL
export async function POST(req: Request) {
  try {
    const { sessionId, isNew } = await ensureSession();
    const body = await req.json();

    const newTask = await prisma.task.create({
      data: {
        title: String(body.title || ""),
        minutes: Number(body.minutes || 0),
        due: String(body.due || ""),
        priority: String(body.priority || "medium"),
        notes: body.notes ?? null,
        sessionId,
      },
    });

    const res = NextResponse.json(newTask);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}