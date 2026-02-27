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

const MultiDayScheduleSchema = z.object({
  days: z.array(
    z.object({
      date: z.string().describe("The specific date this schedule is for (YYYY-MM-DD)"),
      schedule: z.array(
        z.object({
          title: z.string(),
          start: z.string().describe("24h format HH:MM"),
          end: z.string().describe("24h format HH:MM"),
          tag: z.enum(["Deep Work", "Class", "Break", "Admin", "Health", "Leisure"]),
          reasoning: z.string().describe("Why this time was chosen"),
        })
      ),
    })
  ),
});

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/^(deep work|focus block|class|break|admin|health|leisure)\s*:\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDuration(start: string, end: string): number {
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

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
  date: z.string().optional(),
  dates: z.array(z.string()).optional(),
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

    const promptDate = parsed.data.userPrompt && /\d{4}-\d{2}-\d{2}/.test(parsed.data.userPrompt)
      ? parsed.data.userPrompt.match(/\d{4}-\d{2}-\d{2}/)?.[0]
      : undefined;

    const fallbackDate = parsed.data.date || promptDate || new Date().toISOString().split("T")[0];
    const dates = (parsed.data.dates && parsed.data.dates.length > 0
      ? parsed.data.dates
      : [fallbackDate]
    )
      .map((d) => d.trim())
      .filter(Boolean);

    const tasksPromise = Promise.all(
      parsed.data.tasks.map(async (task) => {
        if (task.id) return task;

        const createdTask = await prisma.task.create({
          data: {
            title: task.title,
            minutes: task.minutes,
            due: task.due || dates[0],
            priority: task.priority || "medium",
            userId,
          },
        });

        return { ...task, id: createdTask.id };
      })
    );

    const generatePromise = generateObject({
      model: openai("gpt-4.1-mini"),
      schema: MultiDayScheduleSchema,
      prompt: `
        You are an elite productivity scheduler.

        Target Dates to schedule across: ${dates.join(", ")}

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

        2. **Multi-day Distribution (IMPORTANT)**:
           - Distribute tasks logically across the provided Target Dates.
           - Do not cram all tasks into one day if multiple dates are provided.
           - Return one daily schedule for each Target Date.

        3. **Pacing & Gaps (IMPORTANT)**:
           - **Light Workload**: If tasks are few/short (e.g., 2 hours of work for a whole day), **DO NOT cram them** all at the start. Spread them out with **gaps** (unused time) between tasks.
           - **Heavy Workload**: If tasks are heavy, group Deep Work together and use short 10-15m "Break" blocks between them.
           - **Gap Strategy**: Leave blank time naturally in the schedule—do NOT create filler "Break", "Leisure", or "Admin" blocks just to fill gaps. Only create explicit blocks for user-input tasks and necessary short breaks between Deep Work.

        4. **Standard Constraints**:
            - Group deep work tasks together when possible.
            - Respect task durations but split if >90 mins.
        5. **Reasoning**:
            - Keep reasoning under 10 words.
      `,
    });

    const [tasksWithIds, aiResult] = await Promise.all([tasksPromise, generatePromise]);

    const savePromises = aiResult.object.days.map(async (dayPlan) => {
      const scheduleWithTaskId = await Promise.all(
        dayPlan.schedule.map(async (block) => {
          const normalizedBlockTitle = normalizeTitle(block.title);
          const matchedTask = tasksWithIds.find((task) => {
            if (!task.id) return false;
            const normalizedTaskTitle = normalizeTitle(task.title);
            return (
              normalizedBlockTitle === normalizedTaskTitle ||
              normalizedBlockTitle.includes(normalizedTaskTitle) ||
              normalizedTaskTitle.includes(normalizedBlockTitle)
            );
          });

          let taskId = matchedTask?.id ?? null;

          if (!taskId && (block.tag === "Deep Work" || block.tag === "Class")) {
            try {
              const newAiTask = await prisma.task.create({
                data: {
                  userId,
                  title: block.title,
                  minutes: getDuration(block.start, block.end),
                  due: dayPlan.date,
                  priority: "medium",
                },
              });
              taskId = newAiTask.id;
            } catch (error) {
              console.error("Failed to promote AI block to task table:", error);
            }
          }

          return {
            ...block,
            taskId,
          };
        })
      );

      return prisma.schedule.upsert({
        where: {
          userId_date: { userId, date: dayPlan.date },
        },
        update: {
          blocks: scheduleWithTaskId,
          userPrompt: promptValue,
        },
        create: {
          userId,
          date: dayPlan.date,
          blocks: scheduleWithTaskId,
          userPrompt: promptValue,
        },
      });
    });

    await Promise.all(savePromises);

    return NextResponse.json({
      success: true,
      daysGenerated: aiResult.object.days.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate plan";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}