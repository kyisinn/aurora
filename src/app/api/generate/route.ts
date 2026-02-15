import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUser } from "@/lib/session";

const ScheduleSchema = z.object({
  schedule: z.array(
    z.object({
      title: z.string(),
      start: z.string().describe("24h format HH:MM"),
      end: z.string().describe("24h format HH:MM"),
      tag: z.enum(["Deep Work", "Class", "Break", "Admin", "Health"]),
      reasoning: z.string().describe("Why this time was chosen"),
    })
  ),
});

const GenerateRequestSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      minutes: z.number(),
      due: z.string().optional(),
      priority: z.string().optional(),
    })
  ),
  userPrompt: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = GenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const { userId } = await ensureUser();
    const promptValue = parsed.data.userPrompt?.trim() || null;

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ScheduleSchema,
      prompt: `
        You are an elite productivity scheduler.

        Tasks to schedule:
        ${JSON.stringify(parsed.data.tasks)}

        User preferences/constraints:
        "${promptValue ?? ""}"

        Rules:
        - Work day is typically 9:00 - 18:00 unless specified.
        - Group deep work tasks together.
        - Insert 10-15m breaks between heavy cognitive blocks.
        - Respect task duration but split if >90 mins.
      `,
    });

    const saved = await prisma.schedule.create({
      data: {
        userId,
        blocks: object.schedule,
        userPrompt: promptValue,
      },
    });

    return NextResponse.json(saved);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate plan";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}