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
          <div className="text-xl font-bold">Achievements</div>
          <div className="text-sm text-white/60">
            Complete tasks to collect points and level up.
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={() => setRefreshCount((prev) => prev + 1)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/tasks")}>Tasks</Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>Dashboard</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-white/60">Level</div>
          <div className="mt-1 text-2xl font-bold">{level}</div>
          <div className="mt-1 text-sm text-white/60">Keep completing tasks</div>
        </Card>

        <Card>
          <div className="text-sm text-white/60">Total points</div>
          <div className="mt-1 text-2xl font-bold">{totalPoints} XP</div>
          <div className="mt-1 text-sm text-white/60">From completed tasks</div>
        </Card>

        <Card>
          <div className="text-sm text-white/60">Completed</div>
          <div className="mt-1 text-2xl font-bold">{completedTasks.length}</div>
          <div className="mt-1 text-sm text-white/60">{totalMinutes} minutes done</div>
        </Card>
      </div>

      <Card>
        <div className="text-base font-semibold">Completed task rewards</div>

        {isLoading ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-6 animate-pulse">
            <div className="h-3 w-1/3 rounded bg-white/10" />
            <div className="mt-3 h-3 w-2/3 rounded bg-white/10" />
            <div className="mt-3 h-3 w-1/2 rounded bg-white/10" />
          </div>
        ) : error ? (
          <div className="mt-4 text-sm text-rose-300">{error}</div>
        ) : !completedTasks.length ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            No completed tasks yet. Mark a task as done to earn points.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {completedTasks
              .slice()
              .sort((a, b) => (b.due || "").localeCompare(a.due || ""))
              .map((task) => (
                <div
                  key={task.id}
                  className="rounded-3xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{task.title}</div>
                      <div className="mt-1 text-xs text-white/60">
                        {task.minutes} min • {task.priority}
                        {task.due ? ` • due ${task.due}` : ""}
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                      +{pointsForTask(task)} XP
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
