"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

/* ================= TYPES ================= */

type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  minutes: number;
  due: string;
  priority: Priority;
};

/* ================= PAGE ================= */

export default function GeneratePage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  /* Load tasks + previous prompt */
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [tasksRes, scheduleRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/schedule"),
        ]);

        if (tasksRes.ok) {
          const data: Task[] = await tasksRes.json();
          if (active) setTasks(data);
        } else if (active) {
          setTasks([]);
        }

        if (scheduleRes.ok) {
          const schedule = await scheduleRes.json();
          // Pre-fill the prompt if they have one saved
          if (schedule?.userPrompt && active) {
            setUserPrompt(String(schedule.userPrompt));
          }
        }
      } catch {
        if (active) setTasks([]);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  /* AI-style summary prompt (preview only) */
  const autoPrompt = useMemo(() => {
    const lines = tasks.map(
      (t) => `• ${t.title} (${t.minutes} min, ${t.priority}, due ${t.due})`
    );

    return `User request:
${userPrompt || "(none)"}

Tasks:
${lines.length ? lines.join("\n") : "No tasks added"}

Rules:
- Prioritize urgent tasks
- Insert breaks
- Keep schedule realistic`;
  }, [tasks, userPrompt]);

  async function handleGenerate() {
    if (!userPrompt.trim()) {
      alert("Please add instructions before generating a schedule.");
      return;
    }

    setLoading(true);
    try {
      // Send data to AI route (tasks optional, instructions required)
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          userPrompt,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI generation failed");
      }

      // Success! The backend has already saved the schedule.
      router.push("/dashboard-preview");
    } catch (err) {
      console.error("Failed to generate schedule", err);
      alert("Failed to generate schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Generate schedule</div>
          <div className="text-xs text-white/50">
            Aurora uses AI to build a realistic plan for you
          </div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/tasks")}>
          ← Tasks
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* User prompt */}
        <Card>
          <div className="space-y-3">
            <div className="text-sm font-semibold">Your instruction</div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={8}
              placeholder="e.g. I have an exam tomorrow, focus more in the morning. Also, I need a long lunch break."
              className="w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
            <Button onClick={handleGenerate} disabled={loading || !userPrompt.trim()}>
              {loading ? "Generating with AI…" : "Generate schedule →"}
            </Button>
          </div>
        </Card>

        {/* AI prompt preview */}
        <Card>
          <div className="space-y-3">
            <div className="text-sm font-semibold">Context preview</div>
            <textarea
              value={autoPrompt}
              readOnly
              rows={12}
              className="w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/80"
            />
            <div className="text-xs text-white/40">
              Tasks loaded: <strong>{tasks.length}</strong>
            </div>
          </div>
        </Card>

        {/* Visual task list preview */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Task list</div>
              <div className="text-xs text-white/40">{tasks.length} items</div>
            </div>
            <div className="space-y-2">
              {tasks.length ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold">{task.title}</div>
                      <div className="text-[10px] uppercase tracking-wide text-white/60">
                        {task.priority}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50">
                      <span>{task.minutes} min</span>
                      <span>•</span>
                      <span>{task.due ? `Due ${task.due}` : "No due date"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-3 py-6 text-center text-xs text-white/50">
                  No tasks yet. Add tasks to preview them here.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}