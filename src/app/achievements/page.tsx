"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  minutes: number;
  due?: string | null;
  priority: Priority;
  completed?: boolean;
};

function pointsForTask(task: Task) {
  const base = Math.max(10, Math.round(task.minutes / 5));
  const multiplier =
    task.priority === "high" ? 1.5 : task.priority === "medium" ? 1.2 : 1;
  return Math.round(base * multiplier);
}

function levelForPoints(points: number) {
  if (points >= 1200) return "Master";
  if (points >= 700) return "Pro";
  if (points >= 300) return "Focused";
  if (points >= 100) return "Starter";
  return "Beginner";
}

function getTaskColorClasses(priority: Priority) {
  const base = "rounded-3xl border p-4 transition-all duration-300 ";
  if (priority === "high") {
    return base + "border-orange-500/30 bg-orange-500/10 border-l-4 border-l-orange-400/80";
  }
  if (priority === "medium") {
    return base + "border-yellow-500/30 bg-yellow-500/10 border-l-4 border-l-yellow-400/80";
  }
  return base + "border-emerald-500/30 bg-emerald-500/10 border-l-4 border-l-emerald-400/80";
}

export default function AchievementsPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/tasks");
      if (!res.ok) {
        throw new Error("Failed to load achievements.");
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setTasks([]);
        return;
      }

      setTasks(
        data.map((t) => ({
          ...t,
          id: String(t.id),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load achievements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [refreshCount]);

  // Reload tasks when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      setRefreshCount((prev) => prev + 1);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setRefreshCount((prev) => prev + 1);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const completedTasks = useMemo(
    () => tasks.filter((t) => Boolean(t.completed)),
    [tasks]
  );

  const totalPoints = useMemo(
    () => completedTasks.reduce((sum, task) => sum + pointsForTask(task), 0),
    [completedTasks]
  );

  const totalMinutes = useMemo(
    () => completedTasks.reduce((sum, task) => sum + (Number(task.minutes) || 0), 0),
    [completedTasks]
  );

  const level = useMemo(() => levelForPoints(totalPoints), [totalPoints]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">Achievements</div>
          <div className="text-sm text-white/60">
            Complete tasks to collect points and level up.
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
            onClick={() => setRefreshCount((prev) => prev + 1)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button
            className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="!border-violet-500/40 !bg-gradient-to-br !from-violet-500/15 !via-black/20 !to-indigo-500/10">
          <div className="text-sm text-white/70">Current Level</div>
          <div className="mt-1 bg-gradient-to-r from-violet-200 to-indigo-200 bg-clip-text text-3xl font-extrabold text-transparent">
            {level}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/50">
            Keep completing tasks to rank up
          </div>
        </Card>

        <Card className="!border-amber-500/40 !bg-gradient-to-br !from-amber-500/15 !via-black/20 !to-yellow-500/10">
          <div className="text-sm text-white/70">Total Lifetime XP</div>
          <div className="mt-1 bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-3xl font-extrabold text-transparent">
            {totalPoints} XP
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/50">
            Calculated from {completedTasks.length} tasks
          </div>
        </Card>

        <Card className="!border-emerald-500/40 !bg-gradient-to-br !from-emerald-500/15 !via-black/20 !to-teal-500/10">
          <div className="text-sm text-white/70">Productivity Streak</div>
          <div className="mt-1 bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-3xl font-extrabold text-transparent">
            {completedTasks.length}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/50">
            {totalMinutes} total minutes crushed
          </div>
        </Card>
      </div>

      <Card className="!border-white/10 !bg-white/[0.03]">
        <div className="mb-4 text-base font-semibold">Completed task rewards</div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-3xl bg-white/5" />
            <div className="h-20 rounded-3xl bg-white/5" />
          </div>
        ) : error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : !completedTasks.length ? (
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            No completed tasks yet. Mark a task as done to earn points.
          </div>
        ) : (
          <div className="space-y-3">
            {completedTasks
              .slice()
              .sort((a, b) => (b.due || "").localeCompare(a.due || ""))
              .map((task) => (
                <div
                  key={task.id}
                  className={getTaskColorClasses(task.priority)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{task.title}</div>
                      <div className="mt-1 text-[11px] font-medium uppercase tracking-tight text-white/60">
                        {task.minutes} min • {task.priority} priority
                        {task.due ? ` • finished ${task.due}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                      +{pointsForTask(task)} <span className="font-normal text-white/50">XP</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
