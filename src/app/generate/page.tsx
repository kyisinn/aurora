"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

/* ================= TYPES ================= */

type Priority = "low" | "medium" | "high";

type TimePreference = "morning" | "afternoon" | "evening";

type Task = {
  id?: string;
  title: string;
  minutes: number;
  due?: string;
  priority: Priority;
};

type SetupPayload = {
  preference: TimePreference;
  intensity: "light" | "balanced" | "intense";
  focusHours: number;
  tasks: Array<{ title: string; minutes: number; priority: Priority }>;
  preview?: Array<{ title: string; start: string; end: string; type: string; priority?: string }>;
};

type ProfileResponse = {
  preferences?: { timePreference?: TimePreference } | null;
};



/* ================= PAGE ================= */

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");
  const effectiveDate = selectedDate ?? new Date().toISOString().split("T")[0];

  const [timePreference, setTimePreference] = useState<TimePreference | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  /* Load tasks + previous prompt */
  useEffect(() => {
    let active = true;

    const getSetup = () => {
      try {
        const raw = localStorage.getItem("aurora_setup");
        return raw ? (JSON.parse(raw) as SetupPayload) : null;
      } catch {
        return null;
      }
    };

    const mapSetupTasks = (setup: SetupPayload | null) =>
      setup?.tasks?.map((t, idx) => ({
        id: `setup-${idx}`,
        title: t.title,
        minutes: t.minutes,
        priority: t.priority,
      })) ?? [];

    const load = async () => {
      const setup = getSetup();
      const setupTasks = mapSetupTasks(setup);

      if (setup?.preference && active) {
        setTimePreference(setup.preference);
      }

      try {
        const scheduleQuery = `?date=${encodeURIComponent(effectiveDate)}`;

        const [tasksRes, scheduleRes, profileRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch(`/api/schedule${scheduleQuery}`),
          fetch("/api/profile"),
        ]);

        if (tasksRes.ok) {
          const data: Task[] = await tasksRes.json();
          if (active) {
            if (Array.isArray(data) && data.length > 0) setTasks(data);
            else if (setupTasks.length > 0) setTasks(setupTasks);
            else setTasks([]);
          }
        } else if (active) {
          if (setupTasks.length > 0) setTasks(setupTasks);
          else setTasks([]);
        }

        if (scheduleRes.ok) {
          const schedule = await scheduleRes.json();
          if (schedule?.userPrompt && active) {
            setUserPrompt(String(schedule.userPrompt));
          }
        }

        if (profileRes.ok) {
          const profile = (await profileRes.json()) as ProfileResponse | null;
          const pref = profile?.preferences?.timePreference;
          if (active && !setup?.preference && pref) {
            setTimePreference(pref);
          }
        }
      } catch {
        if (active) {
          if (setupTasks.length > 0) setTasks(setupTasks);
          else setTasks([]);
        }
      }
    };

    void load();

    const handleFocus = () => {
      void load();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [effectiveDate]);

  /* AI-style summary prompt (preview only) */
  const autoPrompt = useMemo(() => {
    const lines = tasks.map(
      (t) => `• ${t.title} (${t.minutes} min, ${t.priority}${t.due ? `, due ${t.due}` : ""})`
    );

    const preferenceLine = timePreference
      ? `Preferred focus window: ${timePreference}`
      : "Preferred focus window: (not set)";

    return `User request:
${userPrompt || "(none)"}

  Date: ${effectiveDate}

${preferenceLine}

Tasks:
${lines.length ? lines.join("\n") : "No tasks added"}

Rules:
- Prioritize urgent tasks
- Insert breaks
- Keep schedule realistic`;
  }, [tasks, userPrompt, timePreference]);

  async function handleGenerate() {
    if (!userPrompt.trim() && tasks.length === 0) {
      alert("Please add instructions or tasks before generating a schedule.");
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
          preferences: timePreference ? { timePreference } : undefined,
          date: effectiveDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI generation failed");
      }

      // Success! The backend has already saved the schedule.
      router.push(`/dashboard-preview?date=${encodeURIComponent(effectiveDate)}`);
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
          <div className="text-xl font-semibold">Generate schedule</div>
          <div className="text-base text-white/50">
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
            <div className="text-lg font-semibold">Your instruction</div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={8}
              placeholder="e.g. I have an exam tomorrow, focus more in the morning. Also, I need a long lunch break."
              className="w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-lg outline-none focus:border-violet-500"
            />
            <Button onClick={handleGenerate} disabled={loading || (!userPrompt.trim() && tasks.length === 0)}>
              {loading ? "Generating with AI…" : "Generate schedule →"}
            </Button>
          </div>
        </Card>

        {/* AI prompt preview */}
        <Card>
          <div className="space-y-3">
            <div className="text-lg font-semibold">Context preview</div>
            <textarea
              value={autoPrompt}
              readOnly
              rows={12}
              className="w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white/80"
            />
            <div className="text-base text-white/40">
              Tasks loaded: <strong>{tasks.length}</strong>
            </div>
          </div>
        </Card>

        {/* Visual task list preview */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Task list</div>
              <div className="text-base text-white/40">{tasks.length} items</div>
            </div>
            <div className="space-y-2">
              {tasks.length ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-base font-semibold">{task.title}</div>
                      <div className="text-sm uppercase tracking-wide text-white/60">
                        {task.priority}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-base text-white/50">
                      <span>{task.minutes} min</span>
                      <span>•</span>
                      <span>{task.due ? `Due ${task.due}` : "No due date"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-3 py-6 text-center text-base text-white/50">
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