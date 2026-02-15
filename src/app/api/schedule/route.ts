import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applySessionCookie, ensureSession } from "@/lib/session";

export async function GET() {
  try {
    const { sessionId, isNew } = await ensureSession();

    const schedule = await prisma.schedule.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    const res = NextResponse.json(schedule ?? null);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, isNew } = await ensureSession();
    const body = await req.json();

    const schedule = await prisma.schedule.create({
      data: {
        sessionId,
        blocks: body.blocks ?? [],
        userPrompt: body.userPrompt ?? null,
      },
    });

    const res = NextResponse.json(schedule);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to save schedule" }, { status: 500 });
  }
}