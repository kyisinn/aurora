import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

// Define the context type for Next.js 15+
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { userId } = await ensureUser();
    // 1. AWAIT the params here
    const { id } = await context.params; 
    
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.minutes !== undefined) data.minutes = Number(body.minutes);
    if (body.due !== undefined) data.due = String(body.due);
    if (body.priority !== undefined) data.priority = String(body.priority);
    if (body.notes !== undefined) data.notes = body.notes ?? null;
    if (body.completed !== undefined) data.completed = Boolean(body.completed);

    const updated = await prisma.task.updateMany({
      where: { id, userId }, // Use the awaited id
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const task = await prisma.task.findFirst({
      where: { id, userId },
    });

    return NextResponse.json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update task";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await ensureUser();
    // 1. AWAIT the params here
    const { id } = await context.params;

    const removed = await prisma.task.deleteMany({
      where: { id, userId }, // Use the awaited id
    });

    if (removed.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete task";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}