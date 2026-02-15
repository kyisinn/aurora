import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await ensureUser();
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.minutes !== undefined) data.minutes = Number(body.minutes);
    if (body.due !== undefined) data.due = String(body.due);
    if (body.priority !== undefined) data.priority = String(body.priority);
    if (body.notes !== undefined) data.notes = body.notes ?? null;
    if (body.completed !== undefined) data.completed = Boolean(body.completed);

    const updated = await prisma.task.updateMany({
      where: { id: params.id, userId },
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const task = await prisma.task.findFirst({
      where: { id: params.id, userId },
    });

    return NextResponse.json(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update task";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await ensureUser();

    const removed = await prisma.task.deleteMany({
      where: { id: params.id, userId },
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