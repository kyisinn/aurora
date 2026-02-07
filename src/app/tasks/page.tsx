"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  minutes: number; // duration estimate
  due: string; // YYYY-MM-DD
  priority: Priority;
  notes?: string;
};

const LS_TASKS = "aurora:tasks";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function priorityBadge(p: Priority) {
  const base = "rounded-full border px-2 py-0.5 text-[10px] font-semibold";
  if (p === "high") return `${base} border-rose-500/30 bg-rose-500/10 text-rose-200`;
  if (p === "medium") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-200`;
  return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`;
}

export default function TasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState<number>(60);
  const [due, setDue] = useState<string>(todayISO());
  const [priority, setPriority] = useState<Priority>("medium");
  const [notes, setNotes] = useState("");

  // load tasks
  useEffect(() => {
    const saved = safeParse<Task[]>(localStorage.getItem(LS_TASKS), []);
    setTasks(saved);
  }, []);

  // autosave
  useEffect(() => {
    localStorage.setItem(LS_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  const stats = useMemo(() => {
    const totalMin = tasks.reduce((s, t) => s + (Number(t.minutes) || 0), 0);
    const high = tasks.filter((t) => t.priority === "high").length;
    const dueSoon = [...tasks].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
    return { totalMin, high, dueSoon };
  }, [tasks]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setMinutes(60);
    setDue(todayISO());
    setPriority("medium");
    setNotes("");
  }

  function submit() {
    const clean = title.trim();
    if (!clean) return alert("Please enter a task title.");
    if (!minutes || minutes < 10) return alert("Duration must be at least 10 minutes.");
    if (!due) return alert("Please select a due date.");

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, title: clean, minutes, due, priority, notes } : t
        )
      );
      resetForm();
      return;
    }

    const t: Task = {
      id: uid(),
      title: clean,
      minutes,
      due,
      priority,
      notes: notes.trim() || undefined,
    };

    setTasks((prev) => [t, ...prev]);
    resetForm();
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setTitle(t.title);
    setMinutes(t.minutes);
    setDue(t.due);
    setPriority(t.priority);
    setNotes(t.notes || "");
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) resetForm();
  }

  function seedExamples() {
    const seed: Task[] = [
      { id: uid(), title: "Finish assignment draft", minutes: 120, due: todayISO(), priority: "high" },
      { id: uid(), title: "Read chapter + take notes", minutes: 90, due: todayISO(), priority: "medium" },
      { id: uid(), title: "Workout / walk", minutes: 45, due: todayISO(), priority: "low" },
    ];
    setTasks((prev) => [...seed, ...prev]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Tasks</div>
          <div className="text-xs text-white/50">
            Add assignments & exams so Aurora can schedule them
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/dashboard-preview")}>
            Preview
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
          <Button onClick={() => router.push("/generate")}>Generate</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs text-white/60">Total tasks</div>
          <div className="mt-1 text-2xl font-bold">{tasks.length}</div>
          <div className="mt-1 text-sm text-white/60">in your list</div>
        </Card>

        <Card>
          <div className="text-xs text-white/60">Workload</div>
          <div className="mt-1 text-2xl font-bold">{Math.round(stats.totalMin / 60)}h</div>
          <div className="mt-1 text-sm text-white/60">{stats.totalMin} minutes total</div>
        </Card>

        <Card>
          <div className="text-xs text-white/60">High priority</div>
          <div className="mt-1 text-2xl font-bold">{stats.high}</div>
          <div className="mt-1 text-sm text-white/60">urgent items</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold">
                  {editingId ? "Edit task" : "Add a task"}
                </div>
                <div className="text-xs text-white/60">
                  Include duration + due date for better schedules.
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/60">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Study for midterm"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-white/60">Duration (min)</label>
                  <input
                    type="number"
                    value={minutes}
                    min={10}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/60">Due</label>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/60">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                        priority === p
                          ? "border-violet-500/50 bg-violet-600"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {p === "low" ? "Low" : p === "medium" ? "Medium" : "High"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/60">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g., focus on chapters 3-5"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid gap-2">
                <Button onClick={submit}>{editingId ? "Update task" : "Add task"}</Button>
                {editingId ? (
                  <Button variant="ghost" onClick={resetForm}>
                    Cancel edit
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={seedExamples}>
                    Add example tasks
                  </Button>
                )}
              </div>

              <div className="text-xs text-white/40">
                Saved to <code>localStorage</code>: <code>aurora:tasks</code>
              </div>
            </div>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Your task list</div>
                <div className="text-xs text-white/60">Click a task to edit</div>
              </div>
              <Button variant="ghost" onClick={() => router.push("/generate")}>
                Use tasks → Generate
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {!tasks.length ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                  No tasks yet. Add your first task on the left.
                </div>
              ) : (
                tasks
                  .slice()
                  .sort((a, b) => a.due.localeCompare(b.due))
                  .map((t) => (
                    <div
                      key={t.id}
                      className="rounded-3xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="min-w-0 text-left"
                        >
                          <div className="text-sm font-semibold truncate">{t.title}</div>
                          <div className="mt-1 text-xs text-white/60">
                            {t.minutes} min • due {t.due}
                          </div>
                          {t.notes ? (
                            <div className="mt-1 text-xs text-white/45 line-clamp-2">
                              {t.notes}
                            </div>
                          ) : null}
                        </button>

                        <div className="flex items-center gap-2">
                          <span className={priorityBadge(t.priority)}>
                            {t.priority.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(t.id)}
                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Due soon</div>
            <div className="mt-2 text-sm text-white/60 whitespace-pre-line">
              {stats.dueSoon.length
                ? stats.dueSoon.map((u) => `• ${u.due} — ${u.title}`).join("\n")
                : "No upcoming tasks yet."}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}