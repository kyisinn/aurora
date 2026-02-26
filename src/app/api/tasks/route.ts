import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

// GET all tasks from MySQL
export async function GET() {
  try {
    const { userId } = await ensureUser();

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { due: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch tasks";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// POST a new task to MySQL
export async function POST(req: Request) {
  try {
    const { userId } = await ensureUser();
    const body = await req.json();
    const dueValue =
      typeof body.due === "string" && body.due.trim().length > 0
        ? body.due.trim()
        : new Date().toISOString().split("T")[0];

    const newTask = await prisma.task.create({
      data: {
        title: String(body.title || ""),
        minutes: Number(body.minutes || 0),
        due: dueValue,
        priority: String(body.priority || "medium"),
        notes: body.notes ?? null,
        userId,
      },
    });

    return NextResponse.json(newTask);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create task";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}