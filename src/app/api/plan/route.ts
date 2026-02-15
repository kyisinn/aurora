import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applySessionCookie, ensureSession } from "@/lib/session";

export async function GET() {
  try {
    const { sessionId, isNew } = await ensureSession();

    const plan = await prisma.plan.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    const res = NextResponse.json(plan ?? null);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to load plan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, isNew } = await ensureSession();
    const body = await req.json();

    const plan = await prisma.plan.create({
      data: {
        sessionId,
        content: String(body.content || ""),
      },
    });

    const res = NextResponse.json(plan);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to save plan" }, { status: 500 });
  }
}