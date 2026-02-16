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
  priority?: BlockPriority | null;
};
type TaskRow = { title: string; priority?: string | null };

const LS_AUTH = "aurora:authed";

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function tagClass(tag: BlockTag) {
  const base = "rounded-full border px-2 py-0.5 text-[10px] font-semibold";
  if (tag === "Deep Work") return `${base} border-violet-500/30 bg-violet-500/10 text-violet-200`;
  if (tag === "Class") return `${base} border-sky-500/30 bg-sky-500/10 text-sky-200`;
  if (tag === "Break") return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`;
  if (tag === "Health") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-200`;
  return `${base} border-white/10 bg-white/5 text-white/70`;
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

function priorityBarClass(priority: BlockPriority | null, index: number) {
  const base = "rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow-lg";
  if (priority === "High") return `${base} bg-gradient-to-r from-rose-500 to-orange-500`;
  if (priority === "Medium") return `${base} bg-gradient-to-r from-sky-500 to-indigo-500`;
  if (priority === "Low") return `${base} bg-gradient-to-r from-emerald-500 to-teal-500`;
  return index % 2 === 0
    ? `${base} bg-gradient-to-r from-slate-500 to-zinc-500`
    : `${base} bg-gradient-to-r from-neutral-500 to-stone-500`;
}

function priorityCardClass(priority: BlockPriority | null, index: number) {
  if (priority === "High") return "border-rose-500/30 bg-rose-500/10";
  if (priority === "Medium") return "border-sky-500/30 bg-sky-500/10";
  if (priority === "Low") return "border-emerald-500/30 bg-emerald-500/10";
  return index % 2 === 0
    ? "border-white/10 bg-white/5"
    : "border-white/15 bg-white/10";
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

export default function DashboardPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dayStart = 6 * 60;
  const dayEnd = 22 * 60;
  const daySpan = dayEnd - dayStart;
  const rowCount = 3;
  const timeLabels = ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm"];

  // 🔐 auth guard
  useEffect(() => {
    const authed = localStorage.getItem(LS_AUTH) === "true";
    if (!authed) {
      router.push("/login");
      return;
    }

    let active = true;

    async function loadSchedule() {
      try {
        const [scheduleRes, tasksRes] = await Promise.all([
          fetch("/api/schedule"),
          fetch("/api/tasks"),
        ]);
        if (!scheduleRes.ok || !active) return;

        const data = await scheduleRes.json();
        if (!data?.blocks || !active) return;

        const tasks: TaskRow[] = tasksRes.ok ? await tasksRes.json() : [];
        const parsed = (data.blocks as Block[]).map((block) => ({
          ...block,
          priority: resolveBlockPriority(block.title, tasks),
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
  }, [router]);

  const deepCount = useMemo(
    () => blocks.filter((b) => b.tag === "Deep Work").length,
    [blocks]
  );

  async function saveSchedule() {
    try {
      const payloadBlocks = blocks.map(({ priority, ...rest }) => rest);
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="!border-yellow-400/60 !bg-yellow-500/15">
          <div className="text-xs text-white/60">Today</div>
          <div className="mt-1 text-2xl font-bold">{blocks.length} blocks</div>
          <div className="mt-1 text-sm text-white/60">{deepCount} deep sessions</div>
        </Card>

        <Card className="!border-lime-400/60 !bg-lime-500/15">
          <div className="text-xs text-white/60">Status</div>
          <div className="mt-1 text-2xl font-bold">Saved</div>
          <div className="mt-1 text-sm text-white/60">Database</div>
        </Card>

        <Card>
          <div className="text-xs text-white/60">Sync</div>
          <div className="mt-1 text-2xl font-bold">Ready</div>
          <div className="mt-1 text-sm text-white/60">Coming soon</div>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard-preview")}
            className="group flex items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-white hover:text-black"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold group-hover:text-black">Preview Today's</div>
            </div>
          </button>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/get-started")}
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
          <div className="flex justify-between text-[10px] text-white/50">
            {timeLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="relative mt-2 h-40 rounded-3xl border border-white/10 bg-black/30">
            <div className="pointer-events-none absolute inset-0 grid grid-cols-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border-l border-white/10" />
              ))}
            </div>

            {blocks.map((b, idx) => {
              const priority = b.priority ?? "Medium";
              const start = Math.max(toMin(b.start), dayStart);
              const end = Math.min(toMin(b.end), dayEnd);
              const left = ((start - dayStart) / daySpan) * 100;
              const width = Math.max(((end - start) / daySpan) * 100, 6);
              const row = idx % rowCount;
              const top = 10 + row * 42;

              return (
                <div
                  key={`${b.title}-${idx}`}
                  className={`absolute ${priorityBarClass(priority)} shadow-black/30`}
                  style={{ left: `${left}%`, width: `${width}%`, top }}
                >
                  <div className="truncate text-[11px]">{b.title}</div>
                  <div className="text-[10px] text-white/80">
                    {b.start} - {b.end}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {detailsOpen ? (
          <div className="mt-4 space-y-2">
            {blocks.map((b, idx) => (
              <div
                key={idx}
                className={`rounded-3xl border p-4 ${priorityCardClass(
                  b.priority ?? null,
                  idx
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
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold">{b.title}</div>
                    )}

                    <div className="mt-1 text-xs text-white/60">
                      {b.start} – {b.end}
                    </div>
                  </div>

                  <span className={tagClass(b.tag)}>{b.tag}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-xs text-white/50">
            Details collapsed
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setDetailsOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
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
    </div>
  );
}