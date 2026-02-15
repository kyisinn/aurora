import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applySessionCookie, ensureSession } from "@/lib/session";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sessionId, isNew } = await ensureSession();
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.minutes !== undefined) data.minutes = Number(body.minutes);
    if (body.due !== undefined) data.due = String(body.due);
    if (body.priority !== undefined) data.priority = String(body.priority);
    if (body.notes !== undefined) data.notes = body.notes ?? null;
    if (body.completed !== undefined) data.completed = Boolean(body.completed);

    const updated = await prisma.task.updateMany({
      where: { id: params.id, sessionId },
      data,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const task = await prisma.task.findFirst({
      where: { id: params.id, sessionId },
    });

    const res = NextResponse.json(task);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sessionId, isNew } = await ensureSession();

    const removed = await prisma.task.deleteMany({
      where: { id: params.id, sessionId },
    });

    if (removed.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const res = NextResponse.json({ ok: true });
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}