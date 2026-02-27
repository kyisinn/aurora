"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TimePreference = "morning" | "afternoon" | "evening";
type Intensity = "light" | "balanced" | "intense";

type TaskInput = {
  id?: string;
  title: string;
  minutes: number;
  priority: "high" | "medium" | "low";
  completed?: boolean;
};

type SetupPayload = {
  preference: TimePreference;
  intensity: Intensity;
  focusHours: number;
  tasks: TaskInput[];
  preview?: Array<{ title: string; start: string; end: string; type: string; priority?: string }>;
};

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toLocalIsoDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/^(deep work|focus block|class|break|admin|health|leisure)\s*:\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// (Same logic style as get-started) generate schedule for dashboard if preview not saved
function generateDayPreview(
  preference: TimePreference,
  intensity: Intensity,
  focusHours: number,
  tasks: TaskInput[]
) {
  const startHour = preference === "morning" ? 8 : preference === "afternoon" ? 13 : 18;
  let cur = startHour * 60;

  const maxFocusMin = clamp(focusHours, 2, 8) * 60;

  const intensityMult = intensity === "intense" ? 1.15 : intensity === "light" ? 0.9 : 1;

  const sorted = [...tasks].sort((a, b) => {
    const p = { high: 3, medium: 2, low: 1 };
    return p[b.priority] - p[a.priority];
  });

  const blocks: { title: string; start: string; end: string; type: string; priority?: string }[] =
    [];

  let usedFocus = 0;

  const add = (title: string, dur: number, type: string, priority?: string) => {
    const start = cur;
    const end = cur + dur;
    blocks.push({ title, start: formatTime(start), end: formatTime(end), type, priority });
    cur = end;
  };

  add("Plan & Setup", 10, "break");

  for (let i = 0; i < sorted.length; i++) {
    if (usedFocus >= maxFocusMin) break;

    const t = sorted[i];
    const dur = clamp(Math.round(t.minutes * intensityMult), 20, 180);
    const canFit = Math.min(dur, maxFocusMin - usedFocus);

    if (canFit < 20) break;

    add(t.title, canFit, "focus", t.priority);
    usedFocus += canFit;

    if (usedFocus < maxFocusMin) add("Break", 10, "break");
  }

  add("Wrap up & Review", 15, "personal");
  return blocks.slice(0, 12);
}

function Badge({ text }: { text: string }) {
  return (
    <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/60">
      {text}
    </span>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5">
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm text-white/60 mt-1">{label}</div>
        {sub && <div className="text-xs text-white/45 mt-2">{sub}</div>}
      </div>
    </div>
  );
}

function Timeline({
  blocks,
  height = 520,
  onFinish,
}: {
  blocks: {
    title: string;
    start: string;
    end: string;
    type: string;
    priority?: string;
    taskId?: string | null;
    completed?: boolean;
  }[];
  height?: number;
  onFinish?: (block: {
    title: string;
    start: string;
    end: string;
    type: string;
    priority?: string;
    taskId?: string | null;
    completed?: boolean;
  }) => void;
}) {
  const sorted = [...blocks].sort((a, b) => a.start.localeCompare(b.start));

  const styleByType: Record<string, string> = {
    focus: "bg-gradient-to-br from-blue-500/85 to-indigo-600/85 border-blue-400/30",
    break: "bg-gradient-to-br from-zinc-800 to-zinc-950 border-white/10 text-white/50",
    personal: "bg-gradient-to-br from-amber-500/85 to-orange-600/85 border-amber-400/30",
    class: "bg-gradient-to-br from-purple-500/85 to-pink-600/85 border-purple-400/30",
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10">
      <div className="px-4 py-4 space-y-3" style={{ minHeight: height }}>
        {sorted.map((b, idx) => (
          <div key={`${b.title}-${idx}`} className="flex items-start gap-3">
            <div className="w-16 shrink-0 text-[11px] text-white/50 font-mono leading-4">
              <div>{b.start}</div>
              <div>{b.end}</div>
            </div>

            <div className={`flex-1 rounded-xl border p-3 shadow-lg ${styleByType[b.type] || styleByType.focus}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{b.title}</div>
                  <div className="text-[11px] text-white/70 mt-1">
                    {b.start} - {b.end}
                  </div>
                </div>

                {b.priority && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-lg border whitespace-nowrap ${
                      b.priority === "high"
                        ? "bg-red-500/20 border-red-500/40 text-red-200"
                        : b.priority === "medium"
                        ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                        : "bg-green-500/20 border-green-500/40 text-green-200"
                    }`}
                  >
                    {b.priority}
                  </span>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ScheduleBlock = {
  title: string;
  start: string;
  end: string;
  tag?: string;
  type?: string;
  priority?: string;
  taskId?: string | null;
  completed?: boolean;
};

type ScheduleRecord = {
  blocks?: ScheduleBlock[];
  userPrompt?: string | null;
};

function mapTagToType(tag?: string) {
  if (tag === "Deep Work") return "focus";
  if (tag === "Break") return "break";
  if (tag === "Class") return "class";
  if (tag === "Admin") return "personal";
  if (tag === "Health") return "personal";
  return "focus";
}

function mapTypeToTag(type?: string) {
  if (type === "focus") return "Deep Work";
  if (type === "break") return "Break";
  if (type === "class") return "Class";
  if (type === "personal") return "Admin";
  return "Deep Work";
}

function normalizeTasks(data: unknown): TaskInput[] {
  const raw: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { tasks?: unknown }).tasks)
    ? ((data as { tasks?: unknown[] }).tasks ?? [])
    : [];

  return raw
    .map((item: unknown): TaskInput | null => {
      if (!item || typeof item !== "object") return null;
      const t = item as {
        id?: unknown;
        title?: unknown;
        minutes?: unknown;
        priority?: unknown;
        completed?: unknown;
      };
      const id = typeof t.id === "string" ? t.id : undefined;
      const title = typeof t.title === "string" ? t.title : null;
      const minutes = typeof t.minutes === "number" ? t.minutes : Number(t.minutes);
      const priority: TaskInput["priority"] =
        t.priority === "high" || t.priority === "medium" || t.priority === "low"
          ? t.priority
          : "medium";
      if (!title || !Number.isFinite(minutes)) return null;
      return { id, title, minutes, priority, completed: Boolean(t.completed) };
    })
    .filter((t: TaskInput | null): t is TaskInput => Boolean(t));
}

function resolveBlockTask(
  block: { title: string; taskId?: string | null },
  tasks: TaskInput[]
) {
  if (block.taskId) {
    const byId = tasks.find((task) => task.id === block.taskId);
    if (byId) {
      return {
        taskId: byId.id ?? block.taskId,
        completed: Boolean(byId.completed),
        priority: byId.priority,
      };
    }
  }

  const normalized = normalizeTitle(block.title);
  const direct = tasks.find((task) => normalizeTitle(task.title) === normalized);
  if (direct) {
    return {
      taskId: direct.id ?? null,
      completed: Boolean(direct.completed),
      priority: direct.priority,
    };
  }

  const partial = tasks.find((task) => {
    const taskTitle = normalizeTitle(task.title);
    return normalized.includes(taskTitle) || taskTitle.includes(normalized);
  });

  return {
    taskId: partial?.id ?? null,
    completed: Boolean(partial?.completed),
    priority: partial?.priority,
  };
}

export default function DashboardPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");
  const selectedDatesStr = searchParams.get("dates");
  const targetDates = selectedDatesStr ? selectedDatesStr.split(",") : [];
  const todayIso = useMemo(() => toLocalIsoDate(), []);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const effectiveDate = selectedDatesStr && targetDates.length > 0
    ? targetDates[currentDayIndex]
    : (selectedDate ?? todayIso);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRecord | null>(null);
  const [apiTasks, setApiTasks] = useState<TaskInput[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!selectedDatesStr || targetDates.length === 0) {
      setCurrentDayIndex(0);
      return;
    }
    setCurrentDayIndex((prev) => Math.min(prev, targetDates.length - 1));
  }, [selectedDatesStr, targetDates.length]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/schedule?date=${encodeURIComponent(effectiveDate)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data?.blocks) setSchedule(data);
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          if (active) setApiTasks(normalizeTasks(data));
        }
      } catch {
        // ignore
      }

      try {
        const raw = localStorage.getItem("aurora_setup");
        if (raw && active) setSetup(JSON.parse(raw));
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [effectiveDate, refreshCount]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  const generatedBlocks = useMemo(() => {
    const raw = schedule?.blocks;
    if (!raw || !Array.isArray(raw)) return [];

    return raw.map((b) => {
      const base = {
        title: b.title,
        start: b.start,
        end: b.end,
        type: b.type ?? mapTagToType(b.tag),
        priority: b.priority,
        taskId: b.taskId ?? null,
        completed: Boolean(b.completed),
      };
      const resolved = resolveBlockTask(base, apiTasks);
      return {
        ...base,
        taskId: base.taskId ?? resolved.taskId,
        completed: base.completed || resolved.completed,
        priority: base.priority ?? resolved.priority,
      };
    });
  }, [schedule, apiTasks]);

  const blocks = useMemo(() => {
    if (generatedBlocks.length) return generatedBlocks;
    if (!setup) return [];
    return setup.preview?.length
      ? setup.preview
      : generateDayPreview(setup.preference, setup.intensity, setup.focusHours, setup.tasks);
  }, [generatedBlocks, setup]);

  function resolveTaskIdByTitle(title?: string) {
    if (!title) return null;
    const normalized = normalizeTitle(title);

    const fromBlocks = generatedBlocks.find((entry) => {
      if (!entry.taskId) return false;
      const blockTitle = normalizeTitle(entry.title);
      return (
        blockTitle === normalized ||
        blockTitle.includes(normalized) ||
        normalized.includes(blockTitle)
      );
    });
    if (fromBlocks?.taskId) return fromBlocks.taskId;

    const fromTasks = apiTasks.find((task) => {
      const taskTitle = normalizeTitle(task.title);
      return (
        taskTitle === normalized ||
        taskTitle.includes(normalized) ||
        normalized.includes(taskTitle)
      );
    });

    return fromTasks?.id ?? null;
  }

  async function markBlockDone(block: {
    taskId?: string | null;
    completed?: boolean;
    title?: string;
  }) {
    if (block.completed) return;
    const resolvedTaskId = block.taskId ?? resolveTaskIdByTitle(block.title);
    if (!resolvedTaskId) {
      alert("Unable to find this task to mark as done.");
      return;
    }
    try {
      const res = await fetch(`/api/tasks/${resolvedTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!res.ok) throw new Error("Failed to finish task");

      setApiTasks((prev) =>
        prev.map((task) =>
          task.id === resolvedTaskId ? { ...task, completed: true } : task
        )
      );

      setSchedule((prev) => {
        if (!prev?.blocks) return prev;
        return {
          ...prev,
          blocks: prev.blocks.map((entry) =>
            entry.taskId === resolvedTaskId
              ? { ...entry, completed: true }
              : entry
          ),
        };
      });

      // Refresh tasks data to update achievements
      setRefreshCount((prev) => prev + 1);
      alert("✅ Task marked done! Points awarded.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark task as finished.";
      console.error("markBlockDone error:", message);
      alert(`❌ ${message}`);
    }
  }

  async function persistSchedule(blocksToSave: ScheduleBlock[]) {
    const payloadBlocks = blocksToSave.map((entry) => ({
      title: entry.title,
      start: entry.start,
      end: entry.end,
      tag: entry.tag ?? mapTypeToTag(entry.type),
      priority: entry.priority,
      taskId: entry.taskId ?? null,
      completed: Boolean(entry.completed),
    }));

    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: effectiveDate,
        blocks: payloadBlocks,
        userPrompt: null,
      }),
    });

    if (!res.ok) throw new Error("Failed to update schedule");
  }

  async function removeTaskFromPreview(task: TaskInput) {
    const confirmed = window.confirm(`Remove \"${task.title}\" from live preview?`);
    if (!confirmed) return;

    try {
      if (task.id) {
        const deleteRes = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        if (!deleteRes.ok) throw new Error("Failed to delete task");
      }

      const matchesTask = (left: string, right: string) => {
        const a = normalizeTitle(left);
        const b = normalizeTitle(right);
        return a === b || a.includes(b) || b.includes(a);
      };

      setApiTasks((prev) =>
        prev.filter((entry) => {
          if (task.id && entry.id) return entry.id !== task.id;
          return !matchesTask(entry.title, task.title);
        })
      );

      setSetup((prev) => {
        if (!prev) return prev;
        const nextTasks = prev.tasks.filter((entry) => !matchesTask(entry.title, task.title));
        const nextPreview = (prev.preview ?? []).filter((entry) => !matchesTask(entry.title, task.title));
        const nextSetup = { ...prev, tasks: nextTasks, preview: nextPreview };
        try {
          localStorage.setItem("aurora_setup", JSON.stringify(nextSetup));
        } catch {
          // ignore local storage write errors
        }
        return nextSetup;
      });

      const currentBlocks: ScheduleBlock[] = schedule?.blocks?.length
        ? schedule.blocks
        : blocks.map((entry) => ({
            title: entry.title,
            start: entry.start,
            end: entry.end,
            type: entry.type,
            priority: entry.priority,
            taskId: entry.taskId ?? null,
            completed: Boolean(entry.completed),
          }));

      const nextBlocks = currentBlocks.filter((entry) => {
        if (task.id && entry.taskId) return entry.taskId !== task.id;
        return !matchesTask(entry.title, task.title);
      });

      setSchedule((prev) => ({
        ...(prev ?? {}),
        blocks: nextBlocks,
      }));

      await persistSchedule(nextBlocks);
      setRefreshCount((prev) => prev + 1);
      alert("🗑️ Task removed from live preview.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove task.";
      console.error("removeTaskFromPreview error:", message);
      alert(`❌ ${message}`);
    }
  }

  const totals = useMemo(() => {
    if (!blocks.length) return { focusMin: 0, breakMin: 0, taskCount: 0 };
    let focusMin = 0;
    let breakMin = 0;
    for (const b of blocks) {
      const dur = parseTime(b.end) - parseTime(b.start);
      if (b.type === "focus") focusMin += dur;
      else if (b.type === "break") breakMin += dur;
    }
    return { focusMin, breakMin, taskCount: blocks.filter((b) => b.type === "focus").length };
  }, [blocks]);

  const hasGenerated = generatedBlocks.length > 0;
  const setupTasks = setup?.tasks ?? [];
  const tasks = setupTasks.length ? setupTasks : apiTasks;
  const taskCount = tasks.length
    ? tasks.length
    : generatedBlocks.filter((b) => b.type === "focus").length;
  const highCount = tasks.filter((t) => t.priority === "high").length;

  if (!setup && generatedBlocks.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="max-w-6xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-10 text-center">
            <div className="text-2xl font-bold mb-2">No setup found</div>
            <div className="text-white/60 mb-6">
              Please complete the Get Started flow first.
            </div>
            <button
              onClick={() => router.push(`${hasGenerated ? "/generate" : "/get-started"}?date=${encodeURIComponent(effectiveDate)}`)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-7 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25"
            >
              Go to Get Started
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-white hover:text-black"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm group-hover:text-black"> Back to Dashboard</div>
            </div>
          </button>

          <div className="flex items-center gap-3">

            <button
              onClick={() => {
                const query = selectedDatesStr
                  ? `?dates=${encodeURIComponent(selectedDatesStr)}`
                  : `?date=${encodeURIComponent(effectiveDate)}`;
                router.push(`${hasGenerated ? "/generate" : "/get-started"}${query}`);
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25"
            >
              Regenerate
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              {selectedDatesStr
                ? `Your Batch Plan (${targetDates.length} days)`
                : selectedDate
                ? `Your schedule for ${formatDisplayDate(effectiveDate)}`
                : "Your schedule today"}
            </h1>
            <div className="flex flex-wrap gap-2">
              {setup ? (
                <>
                  <Badge text={`Best time: ${setup.preference}`} />
                  <Badge text={`Intensity: ${setup.intensity}`} />
                  <Badge text={`Focus/day: ${setup.focusHours}h`} />
                  <Badge text={`Tasks: ${taskCount}`} />
                </>
              ) : (
                <>
                  <Badge text="Source: Generated" />
                  <Badge text={`Blocks: ${generatedBlocks.length}`} />
                  {tasks.length > 0 && <Badge text={`Tasks: ${tasks.length}`} />}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-3 font-semibold transition"
              onClick={() => router.push("/get-started")}
            >
              Add more tasks
            </button>
            <button
              className="rounded-xl bg-white text-blue-700 hover:bg-white/90 px-5 py-3 font-semibold transition"
              onClick={() => alert("Export later: connect calendar in next phase ✅")}
            >
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <StatCard
            value={`${Math.round(totals.focusMin / 60 * 10) / 10}h`}
            label="Focus planned"
            sub={`${totals.taskCount} focus blocks`}
          />
          <StatCard
            value={`${totals.breakMin}m`}
            label="Break time"
            sub="Auto-scheduled recovery"
          />
          <StatCard
            value={`${highCount}`}
            label="High priority tasks"
            sub="Handled first in schedule"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Timeline */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-white/60">Timeline</div>
                <div className="text-lg font-bold">Live preview</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50">
                {selectedDatesStr && targetDates.length > 1 && (
                  <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-0.5">
                    <button
                      onClick={() => setCurrentDayIndex((p) => Math.max(0, p - 1))}
                      disabled={currentDayIndex === 0}
                      className="p-1 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentDayIndex((p) => Math.min(targetDates.length - 1, p + 1))}
                      disabled={currentDayIndex === targetDates.length - 1}
                      className="p-1 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                <span>
                  {selectedDatesStr
                    ? `Day ${currentDayIndex + 1}: ${formatDisplayDate(effectiveDate)} • Auto-generated`
                    : selectedDate
                    ? `${formatDisplayDate(effectiveDate)} • Auto-generated`
                    : "Today • Auto-generated"}
                </span>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white/70 transition"
                >
                  Fullscreen
                </button>
              </div>
            </div>
            <div className="max-h-[520px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <Timeline blocks={blocks} height={920} onFinish={markBlockDone} />
            </div>
          </div>

          {/* Task list */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                
                <div className="text-lg font-bold">Your Inputs</div>
              </div>
              <button
                onClick={() => {
                  const query = selectedDatesStr
                    ? `?dates=${encodeURIComponent(selectedDatesStr)}`
                    : `?date=${encodeURIComponent(effectiveDate)}`;
                  router.push(`${hasGenerated ? "/generate" : "/get-started"}${query}`);
                }}
                className="text-sm text-blue-300 hover:text-blue-200 transition"
              >
                Edit
              </button>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {tasks.length ? (
                tasks.map((t, idx) => (
                  <div
                    key={`${t.title}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                        <div className="text-xs text-white/55 mt-1">{t.minutes} min</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-lg border whitespace-nowrap ${
                          t.priority === "high"
                            ? "bg-red-500/20 border-red-500/40 text-red-200"
                            : t.priority === "medium"
                            ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                            : "bg-green-500/20 border-green-500/40 text-green-200"
                        }`}
                        >
                        {t.priority}
                      </span>
                      {t.completed ? (
                        <span className="text-[10px] px-2 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-200">
                          done
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() =>
                          markBlockDone({
                            taskId: t.id ?? null,
                            title: t.title,
                            completed: Boolean(t.completed),
                          })
                        }
                        disabled={Boolean(t.completed)}
                        className={`mr-2 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                          t.completed
                            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {t.completed ? "Done" : "Mark done"}
                      </button>
                      <button
                        onClick={() => removeTaskFromPreview(t)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/20"
                      >
                        Remove from live view
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/60">No tasks added yet.</div>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/55">
              Next upgrade: connect Google Calendar + auto-sync events.
            </div>
          </div>
        </div>
      </main>

      {isFullscreen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-4 md:inset-8 lg:inset-12 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-white/60">Timeline</div>
                <div className="text-lg font-bold">Live preview</div>
              </div>
              <div className="flex items-center gap-3">
                {selectedDatesStr && targetDates.length > 1 && (
                  <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-0.5">
                    <button
                      onClick={() => setCurrentDayIndex((p) => Math.max(0, p - 1))}
                      disabled={currentDayIndex === 0}
                      className="p-1 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentDayIndex((p) => Math.min(targetDates.length - 1, p + 1))}
                      disabled={currentDayIndex === targetDates.length - 1}
                      className="p-1 text-white/70 transition-colors hover:text-white disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="text-xs text-white/50">
                  {selectedDatesStr
                    ? `Day ${currentDayIndex + 1}: ${formatDisplayDate(effectiveDate)} • Auto-generated`
                    : selectedDate
                    ? `${formatDisplayDate(effectiveDate)} • Auto-generated`
                    : "Today • Auto-generated"}
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white/70 transition"
                >
                  Exit fullscreen
                </button>
              </div>
            </div>
            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <Timeline blocks={blocks} height={1400} onFinish={markBlockDone} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}