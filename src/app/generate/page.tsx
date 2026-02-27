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

function getPriorityStyles(priority: Priority) {
  const base = "rounded-2xl border p-3 transition-all duration-300 ";
  if (priority === "high") {
    return base + "border-orange-500/30 bg-orange-500/10 border-l-4 border-l-orange-400/80";
  }
  if (priority === "medium") {
    return base + "border-yellow-500/30 bg-yellow-500/10 border-l-4 border-l-yellow-400/80";
  }
  return base + "border-emerald-500/30 bg-emerald-500/10 border-l-4 border-l-emerald-400/80";
}



/* ================= PAGE ================= */

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datesParam = searchParams.get("dates");
  const dateParam = searchParams.get("date");
  const effectiveDate = dateParam ?? new Date().toISOString().split("T")[0];

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
      setup?.tasks?.map((t) => ({
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
            if (Array.isArray(data) && data.length > 0) {
              const filtered = data.filter((task) => task.due === effectiveDate);

              if (filtered.length > 0) setTasks(filtered);
              else if (setupTasks.length > 0) setTasks(setupTasks);
              else setTasks([]);
            } else if (setupTasks.length > 0) setTasks(setupTasks);
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
          dates: datesParam ? datesParam.split(",") : undefined,
          date: dateParam ?? effectiveDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI generation failed");
      }

      // Success! The backend has already saved the schedule.
      const query = datesParam
        ? `?dates=${datesParam}`
        : `?date=${dateParam || new Date().toISOString().split("T")[0]}`;
      router.push(`/dashboard-preview${query}`);
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
          <div className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-2xl font-bold text-transparent">
            Generate Schedule
          </div>
          <div className="text-sm text-white/50">
            Aurora uses AI to build a realistic plan for you
          </div>
        </div>
        <Button
          variant="ghost"
          className="hover:bg-white/10"
          onClick={() => {
            const query = datesParam
              ? `?dates=${encodeURIComponent(datesParam)}`
              : `?date=${encodeURIComponent(dateParam ?? effectiveDate)}`;
            router.push(`/get-started${query}`);
          }}
        >
          ← Get Started
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User prompt */}
        <Card className="!border-violet-500/40 !bg-gradient-to-br !from-violet-500/10 !via-black/40 !to-indigo-500/5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-2 rounded-full bg-violet-500" />
              <div className="text-lg font-bold">Your instructions</div>
            </div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={8}
              placeholder="e.g. I have an exam tomorrow, focus more in the morning..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base outline-none transition-colors placeholder:text-white/20 focus:border-violet-500/50"
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || (!userPrompt.trim() && tasks.length === 0)}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 py-6 text-lg font-bold shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500"
            >
              {loading ? "AI is thinking..." : "Generate schedule →"}
            </Button>
          </div>
        </Card>

        {/* AI prompt preview */}
        <Card className="!border-white/10 !bg-black/40">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-2 rounded-full bg-slate-500" />
              <div className="text-lg font-bold">Context Preview</div>
            </div>
            <textarea
              value={autoPrompt}
              readOnly
              rows={10}
              className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3 font-mono text-sm text-white/60 scrollbar-thin"
            />
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs font-bold uppercase tracking-widest text-white/40">Tasks Loaded</div>
              <div className="text-xl font-black">{tasks.length}</div>
            </div>
          </div>
        </Card>

        {/* Visual task list preview */}
        <Card className="!border-emerald-500/30 !bg-gradient-to-br !from-emerald-500/5 !via-black/40 !to-teal-500/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-2 rounded-full bg-emerald-500" />
                <div className="text-lg font-bold">Task List</div>
              </div>
              <div className="rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-400">
                {tasks.length} ITEMS
              </div>
            </div>
            <div className="max-h-[440px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {tasks.length ? (
                tasks.map((task, idx) => (
                  <div
                    key={task.id || `temp-${idx}`}
                    className={getPriorityStyles(task.priority)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate pr-2 text-sm font-bold">{task.title}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {task.priority}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">{task.minutes}m</span>
                      <span>•</span>
                      <span className="truncate">{task.due ? `Due ${task.due}` : "No due date"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-white/30">
                  No tasks selected for this date.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}