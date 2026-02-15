import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await ensureUser();

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    return NextResponse.json(profile ?? null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await ensureUser();
    const body = await req.json();

    const profile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
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

    return NextResponse.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save profile";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}