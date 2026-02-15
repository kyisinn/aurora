import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await ensureUser();

    const schedule = await prisma.schedule.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(schedule ?? null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load schedule";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await ensureUser();
    const body = await req.json();

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        blocks: body.blocks ?? [],
        userPrompt: body.userPrompt ?? null,
      },
    });

    return NextResponse.json(schedule);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save schedule";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}