import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const { userId } = await ensureUser();
    
    // 1. Get the date from the URL (e.g., ?date=2026-02-17)
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]; // Default to today

    // 2. Find the schedule SPECIFICALLY for that date
    const schedule = await prisma.schedule.findUnique({
      where: {
        userId_date: { // This uses the @@unique constraint you just added
          userId,
          date,
        },
      },
    });

    // 3. Return empty list if no schedule exists for that day
    return NextResponse.json(schedule || { blocks: [] });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await ensureUser();
    const body = await req.json();

    const date = body?.date || new Date().toISOString().split("T")[0];

    const schedule = await prisma.schedule.upsert({
      where: {
        userId_date: { userId, date },
      },
      update: {
        blocks: body.blocks ?? [],
        userPrompt: body.userPrompt ?? null,
      },
      create: {
        userId,
        date,
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