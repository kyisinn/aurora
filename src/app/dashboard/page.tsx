"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

type BlockTag = "Deep Work" | "Class" | "Break" | "Admin" | "Health";
type BlockPriority = "High" | "Medium" | "Low";
type Block = {
  title: string;
  start: string;
  end: string;
  tag: BlockTag;
  taskId?: string | null;
  priority?: BlockPriority | null;
  completed?: boolean;
};
type TaskRow = {
  id: string;
  title: string;
  priority?: string | null;
  completed?: boolean;
};

const LS_AUTH = "aurora:authed";

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function tagClass(tag: BlockTag) {
  const base = "rounded-full border px-2 py-0.5 text-xs font-semibold";
  if (tag === "Deep Work") return `${base} border-violet-500/30 bg-violet-500/10 text-violet-200`;
  if (tag === "Class") return `${base} border-sky-500/30 bg-sky-500/10 text-sky-200`;
  if (tag === "Break") return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`;
  if (tag === "Health") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-200`;
  return `${base} border-white/10 bg-white/5 text-white/70`;
}

function blockAccentClass(tag: BlockTag) {
  if (tag === "Deep Work") return "border-violet-400/50 bg-violet-500/10";
  if (tag === "Class") return "border-sky-400/50 bg-sky-500/10";
  if (tag === "Break") return "border-emerald-400/50 bg-emerald-500/10";
  if (tag === "Health") return "border-amber-400/50 bg-amber-500/10";
  return "border-white/10 bg-white/5";
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/^(deep work|focus block|class|break|admin|health)\s*:\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePriority(value?: string | null): BlockPriority | null {
  if (!value) return null;
  const text = value.toLowerCase();
  if (text.includes("high")) return "High";
  if (text.includes("low")) return "Low";
  if (text.includes("med")) return "Medium";
  return null;
}

function priorityBarClass(
  priority: BlockPriority | null,
  index: number,
  tag?: BlockTag
) {
  if (tag === "Break") {
    return "rounded-2xl px-3 py-2 text-sm font-semibold text-white shadow-lg bg-gradient-to-r from-neutral-700 to-zinc-800";
  }
  const base = "rounded-2xl px-3 py-2 text-sm font-semibold text-white shadow-lg";
  if (priority === "High") return `${base} bg-gradient-to-r from-[#F97316] to-[#F59E0B]`;
  if (priority === "Medium") return `${base} bg-gradient-to-r from-[#FBBF24] to-[#F59E0B]`;
  if (priority === "Low") return `${base} bg-gradient-to-r from-[#10B981] to-[#14B8A6]`;
  return index % 2 === 0
    ? `${base} bg-gradient-to-r from-[#64748B] to-[#475569]`
    : `${base} bg-gradient-to-r from-[#6366F1] to-[#4F46E5]`;
}

function priorityCardClass(
  priority: BlockPriority | null,
  index: number,
  tag?: BlockTag
) {
  if (tag === "Break") return "border-white/10 bg-black/30";
  if (priority === "High") return "border-orange-500/30 bg-orange-500/10";
  if (priority === "Medium") return "border-yellow-500/30 bg-yellow-500/10";
  if (priority === "Low") return "border-emerald-500/30 bg-emerald-500/10";
  return index % 2 === 0
    ? "border-slate-500/30 bg-slate-500/10"
    : "border-zinc-500/30 bg-zinc-500/10";
}

function priorityAccentClass(
  priority: BlockPriority | null,
  index: number,
  tag?: BlockTag
) {
  if (tag === "Break") return "border-l-4 border-l-neutral-600/70";
  if (priority === "High") return "border-l-4 border-l-orange-400/80";
  if (priority === "Medium") return "border-l-4 border-l-yellow-400/80";
  if (priority === "Low") return "border-l-4 border-l-emerald-400/80";
  return index % 2 === 0
    ? "border-l-4 border-l-slate-400/70"
    : "border-l-4 border-l-indigo-400/70";
}

function resolveBlockPriority(blockTitle: string, tasks: TaskRow[]) {
  const normalized = normalizeTitle(blockTitle);
  const direct = tasks.find(
    (task) => normalizeTitle(task.title) === normalized
  );
  if (direct) return normalizePriority(direct.priority);

  const partial = tasks.find((task) => {
    const taskTitle = normalizeTitle(task.title);
    return normalized.includes(taskTitle) || taskTitle.includes(normalized);
  });
  return normalizePriority(partial?.priority);
}

function resolveBlockTask(block: Block, tasks: TaskRow[]) {
  if (block.taskId) {
    const byId = tasks.find((task) => task.id === block.taskId);
    if (byId) {
      return {
        taskId: byId.id,
        priority: normalizePriority(byId.priority),
        completed: Boolean(byId.completed),
      };
    }
  }

  const normalized = normalizeTitle(block.title);
  const direct = tasks.find((task) => normalizeTitle(task.title) === normalized);
  if (direct) {
    return {
      taskId: direct.id,
      priority: normalizePriority(direct.priority),
      completed: Boolean(direct.completed),
    };
  }

  const partial = tasks.find((task) => {
    const taskTitle = normalizeTitle(task.title);
    return normalized.includes(taskTitle) || taskTitle.includes(normalized);
  });

  return {
    taskId: partial?.id ?? null,
    priority: normalizePriority(partial?.priority),
    completed: Boolean(partial?.completed),
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);
  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [calendarTab, setCalendarTab] = useState<"daily" | "monthly">("daily");
  const [multiSelectedDates, setMultiSelectedDates] = useState<Date[]>([]);
  const dayStart = 6 * 60;
  const baseDayEnd = 22 * 60;
  const baseDaySpan = baseDayEnd - dayStart;
  const rowCount = 3;
  const maxBlockEnd = useMemo(() => {
    if (blocks.length === 0) return baseDayEnd;
    return Math.max(...blocks.map((b) => toMin(b.end)));
  }, [blocks, baseDayEnd]);
  const dayEnd = Math.max(baseDayEnd, maxBlockEnd);
  const daySpan = dayEnd - dayStart;
  const spanRatio = Math.max(1, daySpan / baseDaySpan);
  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    for (let t = dayStart; t <= dayEnd; t += 120) {
      const hour24 = Math.floor(t / 60) % 24;
      const suffix = hour24 >= 12 ? "pm" : "am";
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      labels.push(`${hour12}${suffix}`);
    }
    return labels;
  }, [dayStart, dayEnd]);

  // 🔐 auth guard & Data Fetching (today's schedule)
  useEffect(() => {
    const authed = localStorage.getItem(LS_AUTH) === "true";
    if (!authed) {
      router.push("/login");
      return;
    }

    let active = true;

    async function loadSchedule() {
      try {
        const dateStr = formatDate(new Date());

        const [scheduleRes, tasksRes] = await Promise.all([
          fetch(`/api/schedule?date=${dateStr}`),
          fetch("/api/tasks"),
        ]);
        if (!scheduleRes.ok || !active) return;

        const data = await scheduleRes.json();
        if (!data?.blocks || !active) {
          if (active) setBlocks([]);
          return;
        }

        const tasks: TaskRow[] = tasksRes.ok
          ? (await tasksRes.json()).map((task: TaskRow) => ({ ...task, id: String(task.id) }))
          : [];
        const parsed = (data.blocks as Block[]).map((block) => ({
          ...block,
          ...resolveBlockTask(block, tasks),
        }));

        parsed.sort((a, b) => toMin(a.start) - toMin(b.start));
        setBlocks(parsed);
      } catch {
        // ignore
      }
    }

    loadSchedule();
    return () => {
      active = false;
    };
  }, [router, refreshCount]);

  // Calendar schedule (selected date)
  useEffect(() => {
    let active = true;

    async function loadSelectedSchedule() {
      try {
        const dateStr = formatDate(selectedDate);

        const [scheduleRes, tasksRes] = await Promise.all([
          fetch(`/api/schedule?date=${dateStr}`),
          fetch("/api/tasks"),
        ]);
        if (!scheduleRes.ok || !active) return;

        const data = await scheduleRes.json();
        if (!data?.blocks || !active) {
          if (active) setSelectedBlocks([]);
          return;
        }

        const tasks: TaskRow[] = tasksRes.ok
          ? (await tasksRes.json()).map((task: TaskRow) => ({ ...task, id: String(task.id) }))
          : [];
        const parsed = (data.blocks as Block[]).map((block) => ({
          ...block,
          ...resolveBlockTask(block, tasks),
        }));

        parsed.sort((a, b) => toMin(a.start) - toMin(b.start));
        setSelectedBlocks(parsed);
      } catch {
        // ignore
      }
    }

    loadSelectedSchedule();
    return () => {
      active = false;
    };
  }, [selectedDate, refreshCount]);

  const deepCount = useMemo(
    () => blocks.filter((b) => b.tag === "Deep Work").length,
    [blocks]
  );

  async function saveSchedule() {
    try {
      const payloadBlocks = blocks.map(({ priority, completed, ...rest }) => rest);
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: payloadBlocks, userPrompt: null }),
      });

      if (!res.ok) throw new Error("save failed");
      alert("Schedule saved ✅");
      setEditing(false);
    } catch {
      alert("Failed to save schedule.");
    }
  }

  /** Reassign start/end times so blocks flow sequentially after reorder */
  const reassignTimes = useCallback(
    (list: Block[]): Block[] => {
      const result: Block[] = [];
      let cursor = list.length > 0 ? toMin(list[0].start) : dayStart;
      for (const block of list) {
        const duration = toMin(block.end) - toMin(block.start);
        const startH = String(Math.floor(cursor / 60)).padStart(2, "0");
        const startM = String(cursor % 60).padStart(2, "0");
        const endCursor = cursor + duration;
        const endH = String(Math.floor(endCursor / 60)).padStart(2, "0");
        const endM = String(endCursor % 60).padStart(2, "0");
        result.push({
          ...block,
          start: `${startH}:${startM}`,
          end: `${endH}:${endM}`,
        });
        cursor = endCursor;
      }
      return result;
    },
    [dayStart]
  );

  function moveBlock(idx: number, direction: "up" | "down") {
    setBlocks((prev) => {
      const next = [...prev];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return reassignTimes(next);
    });
  }

  async function markBlockDone(target: Block, mode: "today" | "selected") {
    if (!target.taskId || target.completed) return;
    try {
      const res = await fetch(`/api/tasks/${target.taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });

      if (!res.ok) throw new Error("Failed to mark task as done");

      const markDone = (list: Block[]) =>
        list.map((block) =>
          block.taskId === target.taskId ? { ...block, completed: true } : block
        );

      if (mode === "today") setBlocks((prev) => markDone(prev));
      else setSelectedBlocks((prev) => markDone(prev));

      setRefreshCount((prev) => prev + 1);
      alert("✅ Task marked done! Points awarded.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark task as done.";
      console.error("markBlockDone error:", message);
      alert(`❌ ${message}`);
    }
  }

  // Calendar helpers
  function getDaysInMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  }

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function isPast(d: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }

  function formatDate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const today = new Date();
  const currentMonthValue = today.getFullYear() * 12 + today.getMonth();
  const selectedMonthValue = selectedDate.getFullYear() * 12 + selectedDate.getMonth();
  const monthDiff = selectedMonthValue - currentMonthValue;
  const canGoPrev = monthDiff > 0;
  const canGoNext = monthDiff < 1;
  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    calendarDays.push(date);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="!border-yellow-400/60 !bg-yellow-500/15">
          <div className="text-sm text-white/60">Today</div>
          <div className="mt-1 text-2xl font-bold">{blocks.length} blocks</div>
          <div className="mt-1 text-base text-white/60">{deepCount} deep sessions</div>
        </Card>

        <Card className="!border-lime-400/60 !bg-lime-500/15">
          <div className="text-sm text-white/60">Status</div>
          <div className="mt-1 text-2xl font-bold">Saved</div>
          <div className="mt-1 text-base text-white/60">Database</div>
        </Card>

        <Card>
          <div className="text-sm text-white/60">Sync</div>
          <div className="mt-1 text-2xl font-bold">Ready</div>
          <div className="mt-1 text-base text-white/60">Coming soon</div>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/dashboard-preview?date=${formatDate(selectedDate)}`)}
              className="group flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-300 ease-out hover:bg-white hover:text-black hover:shadow-lg hover:shadow-white/10 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-500/35">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold group-hover:text-black leading-tight transition-colors duration-300 ease-out">
                  {isSameDay(selectedDate, new Date()) ? "Preview Today's" : "Preview Selected"}
                </div>
              </div>
            </button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/achievements")}
              className="w-auto"
            >
              Achievements
            </Button>
            <Button
              onClick={() => router.push(`/get-started?date=${formatDate(selectedDate)}`)}
              className="w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
            >
              Regenerate
            </Button>
            {editing ? (
              <Button onClick={saveSchedule}>Save</Button>
            ) : (
              <Button onClick={() => { setEditing(true); setDetailsOpen(true); }}>Edit</Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/30">
            <div
              className="min-w-full"
              style={{ width: `${spanRatio * 100}%` }}
            >
              <div className="flex justify-between px-3 pt-3 text-xs text-white/50">
                {timeLabels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>

              <div className="relative mt-2 h-40">
                <div className="pointer-events-none absolute inset-0 grid grid-cols-8">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border-l border-white/10" />
                  ))}
                </div>

                {blocks.map((b, idx) => {
                  const priority = b.priority ?? null;
                  const start = Math.max(toMin(b.start), dayStart);
                  const end = Math.min(toMin(b.end), dayEnd);
                  const left = ((start - dayStart) / daySpan) * 100;
                  const width = Math.max(((end - start) / daySpan) * 100, 6);
                  const row = idx % rowCount;
                  const top = 10 + row * 42;

                  return (
                    <div
                      key={`${b.title}-${idx}`}
                      className={`absolute ${priorityBarClass(priority, idx, b.tag)} shadow-black/30`}
                      style={{ left: `${left}%`, width: `${width}%`, top }}
                    >
                      <div className="truncate text-sm font-semibold">{b.title}</div>
                      <div className="text-xs text-white/80">
                        {b.start} - {b.end}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {detailsOpen ? (
          <div className="mt-4 space-y-2">
            {blocks.map((b, idx) => (
              <div
                key={idx}
                className={`rounded-3xl border p-4 ${priorityCardClass(
                  b.priority ?? null,
                  idx,
                  b.tag
                )} ${priorityAccentClass(
                  b.priority ?? null,
                  idx,
                  b.tag
                )} ${
                  editing ? "ring-1 ring-violet-500/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {editing && (
                    <div className="flex flex-col gap-1 mr-2">
                      <button
                        onClick={() => moveBlock(idx, "up")}
                        disabled={idx === 0}
                        className="rounded-lg border border-white/10 bg-white/5 p-1 text-white/60 transition hover:bg-white/10 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveBlock(idx, "down")}
                        disabled={idx === blocks.length - 1}
                        className="rounded-lg border border-white/10 bg-white/5 p-1 text-white/60 transition hover:bg-white/10 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div className="w-full">
                    {editing ? (
                      <input
                        value={b.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setBlocks((prev) =>
                            prev.map((block, i) =>
                              i === idx ? { ...block, title } : block
                            )
                          );
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-base"
                      />
                    ) : (
                      <div className="text-base font-semibold">{b.title}</div>
                    )}

                    <div className="mt-1 text-sm text-white/60">
                      {b.start} – {b.end}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editing && b.taskId ? (
                      <button
                        onClick={() => markBlockDone(b, "today")}
                        disabled={Boolean(b.completed)}
                        className={`rounded-xl border px-2 py-1 text-xs font-semibold transition ${
                          b.completed
                            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {b.completed ? "Completed" : "Mark Done"}
                      </button>
                    ) : null}
                    <span className={tagClass(b.tag)}>{b.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-white/50">
            Details collapsed
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setDetailsOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white hover:text-black"
          >
            <span>{detailsOpen ? "Hide details" : "Show details"}</span>
            <svg
              className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="!border-purple-400/40 !bg-gradient-to-br !from-purple-500/10 !via-black/30 !to-indigo-500/10">
        <div className="mb-6 flex justify-center">
          <div className="flex rounded-full border border-purple-500/30 bg-black/40 p-1 backdrop-blur-md">
            <button
              onClick={() => setCalendarTab("daily")}
              className={`rounded-full px-6 py-1.5 text-sm font-semibold transition-all ${
                calendarTab === "daily"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Daily Plans
            </button>
            <button
              onClick={() => {
                setCalendarTab("monthly");
                if (calendarTab === "daily") setMultiSelectedDates([]);
              }}
              className={`rounded-full px-6 py-1.5 text-sm font-semibold transition-all ${
                calendarTab === "monthly"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Weekly/Batch Plans
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <div className="rounded-3xl border border-purple-400/30 bg-gradient-to-br from-purple-500/10 to-black/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between px-1">
  <button
    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
    disabled={!canGoPrev}
    className={`rounded-lg p-1 transition-colors ${
      canGoPrev
        ? "text-purple-300/70 hover:bg-purple-500/20 hover:text-white"
        : "text-white/10 cursor-not-allowed"
    }`}
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  
  <div className="text-sm font-semibold bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent">
    {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
  </div>

  <button
    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
    disabled={!canGoNext}
    className={`rounded-lg p-1 transition-colors ${
      canGoNext
        ? "text-purple-300/70 hover:bg-purple-500/20 hover:text-white"
        : "text-white/10 cursor-not-allowed"
    }`}
  >
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
</div>
            <div className="grid grid-cols-7 gap-3 w-fit">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-center text-xs font-bold text-purple-300/70 w-8">
                  {d}
                </div>
              ))}
              {calendarDays.map((date, i) => {
                const isToday = date && isSameDay(date, today);
                const isPastDate = !!date && isPast(date);
                const isSelected = date && (
                  calendarTab === "daily"
                    ? isSameDay(date, selectedDate)
                    : multiSelectedDates.some((d) => isSameDay(d, date))
                );
                return (
                  <button
                    key={i}
                    disabled={isPastDate}
                    onClick={() => {
                      if (!date) return;
                      if (calendarTab === "daily") {
                        setSelectedDate(date);
                      } else {
                        setMultiSelectedDates((prev) => {
                          if (prev.length === 0) return [date];

                          const sorted = [...prev].sort((a, b) => a.getTime() - b.getTime());
                          const minDate = sorted[0];
                          const maxDate = sorted[sorted.length - 1];

                          const exists = prev.some((d) => isSameDay(d, date));
                          if (exists) {
                            if (isSameDay(date, minDate) || isSameDay(date, maxDate)) {
                              return prev.filter((d) => !isSameDay(d, date));
                            }
                            return [date];
                          }

                          const isOneDayBefore = isSameDay(
                            date,
                            new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() - 1)
                          );
                          const isOneDayAfter = isSameDay(
                            date,
                            new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 1)
                          );

                          if (isOneDayBefore || isOneDayAfter) {
                            if (prev.length >= 7) {
                              alert("You can only select up to 7 consecutive days.");
                              return prev;
                            }
                            return [...prev, date];
                          }

                          return [date];
                        });
                      }
                    }}
                    className={`rounded-lg p-2 text-xs font-semibold transition-all duration-200 w-8 h-8 ${
                      !date
                        ? ""
                        : isPastDate
                          ? "cursor-not-allowed text-white/20 opacity-40"
                          : isToday
                            ? "border border-blue-400/80 bg-blue-500/25 text-blue-200 hover:bg-blue-500/40 hover:scale-110 shadow-lg shadow-blue-500/20"
                            : isSelected
                              ? "border border-purple-400/80 bg-purple-500/30 text-purple-100 hover:bg-purple-500/45 hover:scale-110 shadow-lg shadow-purple-500/25"
                              : "text-white/50 hover:bg-white/10 hover:scale-105"
                    }`}
                  >
                    {date?.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 h-full">
            <div className="rounded-3xl border border-purple-400/40 bg-gradient-to-br from-indigo-500/10 to-black/40 p-4 w-52 max-h-60 overflow-y-auto backdrop-blur-sm flex flex-col flex-1">
              {calendarTab === "daily" ? (
                <>
                  <div className="mb-3 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-sm font-semibold text-transparent">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  {selectedBlocks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBlocks.map((b, idx) => (
                        <div
                          key={idx}
                          className={`text-xs border-l-2 pl-2 rounded px-2 py-1 transition-all ${blockAccentClass(
                            b.tag
                          )}`}
                        >
                          <div className="font-semibold text-white/90 truncate">{b.title}</div>
                          <div className="text-white/50">{b.start} – {b.end}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/50">No blocks scheduled</div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-3 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-sm font-semibold text-transparent">
                    Batch Planning
                  </div>
                  <div className="mb-2 text-xs text-white/60">
                    Select 5 to 7 days to generate a schedule for the entire week/batch.
                  </div>
                  <div className="mt-2 space-y-1">
                    {multiSelectedDates
                      .slice()
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, index) => (
                        <div key={index} className="rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-200">
                          {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
            {calendarTab === "daily" ? (
              <Button
                onClick={() => {
                  const dateParam = formatDate(selectedDate);
                  const target = selectedBlocks.length > 0 ? "/dashboard-preview" : "/get-started";
                  router.push(`${target}?date=${dateParam}`);
                }}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/25 hover:scale-105 transition-transform duration-200"
              >
                {selectedBlocks.length > 0 ? "Edit Plan" : "Make Plans"}
              </Button>
            ) : (
              <Button
                disabled={multiSelectedDates.length < 5}
                onClick={() => {
                  const datesParam = multiSelectedDates.map((date) => formatDate(date)).join(",");
                  router.push(`/get-started?dates=${datesParam}`);
                }}
                className={`px-4 py-2 text-sm transition-transform duration-200 ${
                  multiSelectedDates.length >= 5
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25 hover:scale-105"
                    : "cursor-not-allowed border border-white/10 bg-white/5 text-white/40"
                }`}
              >
                Make Plans ({multiSelectedDates.length}/7)
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}