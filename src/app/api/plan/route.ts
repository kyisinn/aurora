import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

export async function GET() {
  try {
    const { userId } = await ensureUser();

    const plan = await prisma.plan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(plan ?? null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load plan";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await ensureUser();
    const body = await req.json();

    const plan = await prisma.plan.create({
      data: {
        userId,
        content: String(body.content || ""),
      },
    });

    return NextResponse.json(plan);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save plan";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}