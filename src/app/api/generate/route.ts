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
      tag: z.enum(["Deep Work", "Class", "Break", "Admin", "Health", "Leisure"]),
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
  ).optional().default([]),
  userPrompt: z.string().optional().nullable(),
  preferences: z
    .object({
      timePreference: z.enum(["morning", "afternoon", "evening"]).optional(),
    })
    .optional(),
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
    const preferenceWindow = parsed.data.preferences?.timePreference ?? null;

    // Save tasks (upsert logic)
    await Promise.all(
      parsed.data.tasks.map((task) => {
        if (task.id) return Promise.resolve(); // Skip if exists
        return prisma.task.create({
          data: {
            title: task.title,
            minutes: task.minutes,
            due: task.due || new Date().toISOString().split("T")[0],
            priority: task.priority || "medium",
            userId,
          },
        });
      })
    );

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ScheduleSchema,
      prompt: `
        You are an elite productivity scheduler.

        Tasks to schedule:
        ${JSON.stringify(parsed.data.tasks)}

        User preferences/constraints:
        "${promptValue ?? ""}"

        Preferred focus window:
        "${preferenceWindow ?? ""}"

        CRITICAL RULES:
        1. **Time Window Hierarchy**:
           - **"Whole Day" Request**: If the user asks for "whole day", "full day", or "24 hours", plan from roughly **07:00 to 22:00** (or wake-up to sleep).
           - **Specific Range**: If the user specifies times (e.g. "5pm to 9pm"), strictly respect that window.
           - **Preference Window**: If provided (morning/afternoon/evening):
             - morning: 08:00 - 12:00
             - afternoon: 13:00 - 17:00
             - evening: 18:00 - 22:00
           - **Default**: If no time is mentioned, default to **09:00 - 18:00**.

        2. **Pacing & Gaps (IMPORTANT)**:
           - **Light Workload**: If tasks are few/short (e.g., 2 hours of work for a whole day), **DO NOT cram them** all at the start. Spread them out with **gaps** (unused time) between tasks.
           - **Heavy Workload**: If tasks are heavy, group Deep Work together and use short 10-15m "Break" blocks between them.
           - **Gap Strategy**: Leave blank time naturally in the schedule—do NOT create filler "Break", "Leisure", or "Admin" blocks just to fill gaps. Only create explicit blocks for user-input tasks and necessary short breaks between Deep Work.

        3. **Standard Constraints**:
           - Group deep work tasks together when possible.
           - Respect task durations but split if >90 mins.
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