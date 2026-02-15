import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applySessionCookie, ensureSession } from "@/lib/session";

export async function GET() {
  try {
    const { sessionId, isNew } = await ensureSession();

    const profile = await prisma.profile.findUnique({
      where: { sessionId },
    });

    const res = NextResponse.json(profile ?? null);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { sessionId, isNew } = await ensureSession();
    const body = await req.json();

    const profile = await prisma.profile.upsert({
      where: { sessionId },
      create: {
        sessionId,
        preferences: body.preferences ?? null,
        tools: body.tools ?? null,
        scheduleDraft: body.scheduleDraft ?? null,
      },
      update: {
        preferences: body.preferences ?? null,
        tools: body.tools ?? null,
        scheduleDraft: body.scheduleDraft ?? null,
      },
    });

    const res = NextResponse.json(profile);
    if (isNew) applySessionCookie(res, sessionId);
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}