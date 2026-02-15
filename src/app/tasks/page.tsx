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

  // 1. Add a loading state to handle the transition
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 2. Updated load effect
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Database error:", error);
      setLoadError("Failed to load tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

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

  async function submit() {
    const clean = title.trim();
    if (!clean) return alert("Please enter a task title.");
    if (!minutes || minutes < 10) return alert("Duration must be at least 10 minutes.");
    if (!due) return alert("Please select a due date.");

    setActionError(null);
    try {
      if (editingId) {
        // Update existing task
        const response = await fetch(`/api/tasks/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: clean,
            minutes,
            due,
            priority,
            notes: notes.trim() || null,
          }),
        });
        if (!response.ok) throw new Error("Failed to update task");
        const updated = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === editingId ? updated : t))
        );
        resetForm();
        setActionError(null);
      } else {
        // Create new task
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: clean,
            minutes,
            due,
            priority,
            notes: notes.trim() || null,
          }),
        });
        if (!response.ok) throw new Error("Failed to create task");
        const newTask = await response.json();
        setTasks((prev) => [newTask, ...prev]);
        resetForm();
        setActionError(null);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      setActionError("Failed to save task. Please try again.");
    }
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setTitle(t.title);
    setMinutes(t.minutes);
    setDue(t.due);
    setPriority(t.priority);
    setNotes(t.notes || "");
  }

  async function remove(id: string) {
    setActionError(null);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) resetForm();
      setActionError(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      setActionError("Failed to delete task. Please try again.");
    }
  }

  async function seedExamples() {
    const examples = [
      { title: "Finish assignment draft", minutes: 120, due: todayISO(), priority: "high" as Priority },
      { title: "Read chapter + take notes", minutes: 90, due: todayISO(), priority: "medium" as Priority },
      { title: "Workout / walk", minutes: 45, due: todayISO(), priority: "low" as Priority },
    ];

    setActionError(null);
    try {
      for (const example of examples) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...example, notes: null }),
        });
        if (!response.ok) throw new Error("Failed to create example task");
        const newTask = await response.json();
        setTasks((prev) => [newTask, ...prev]);
      }
      setActionError(null);
    } catch (error) {
      console.error("Error seeding examples:", error);
      setActionError("Failed to add example tasks.");
    }
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

              {actionError ? (
                <div className="text-xs text-red-300">{actionError}</div>
              ) : null}

              <div className="text-xs text-white/40">Saved to database</div>
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
              {isLoading ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 animate-pulse">
                  <div className="h-3 w-1/3 rounded bg-white/10" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-white/10" />
                </div>
              ) : loadError ? (
                <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
                  <div className="font-semibold">Could not load tasks</div>
                  <div className="mt-1 text-xs text-rose-200/80">{loadError}</div>
                  <button
                    type="button"
                    onClick={loadTasks}
                    className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs font-semibold hover:bg-rose-500/30"
                  >
                    Retry
                  </button>
                </div>
              ) : !tasks.length ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                  No tasks yet. Add one to get started.
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