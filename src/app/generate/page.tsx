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

type BlockTag = "Deep Work" | "Class" | "Break" | "Admin" | "Health";

type Block = {
  title: string;
  start: string;
  end: string;
  tag: BlockTag;
};

/* ================= STORAGE KEYS ================= */

const LS = {
  tasks: "aurora:tasks",
  generated: "aurora:generatedSchedule",
  userPrompt: "aurora:userPrompt",
};

/* ================= HELPERS ================= */

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

function priorityWeight(p: Priority) {
  if (p === "high") return 0;
  if (p === "medium") return 1;
  return 2;
}

/* ================= CORE GENERATION ================= */

function generateSchedule(tasks: Task[], userPrompt: string): Block[] {
  let current = toMin("09:00");
  const endDay = toMin("18:00");
  const blocks: Block[] = [];

  // Sort tasks: high priority + earliest due first
  const ordered = [...tasks].sort((a, b) => {
    const p = priorityWeight(a.priority) - priorityWeight(b.priority);
    if (p !== 0) return p;
    return a.due.localeCompare(b.due);
  });

  // Morning routine
  blocks.push({
    title: "Morning routine",
    start: "08:00",
    end: "08:30",
    tag: "Health",
  });

  // Main task blocks
  for (const task of ordered) {
    if (current + task.minutes > endDay) break;

    blocks.push({
      title: `Deep Work: ${task.title}`,
      start: toHHMM(current),
      end: toHHMM(current + task.minutes),
      tag: "Deep Work",
    });

    current += task.minutes;

    // Break after each task
    blocks.push({
      title: "Break",
      start: toHHMM(current),
      end: toHHMM(current + 10),
      tag: "Break",
    });

    current += 10;
  }

  // Admin wrap-up
  if (current + 30 <= endDay) {
    blocks.push({
      title: "Admin / Review",
      start: toHHMM(current),
      end: toHHMM(current + 30),
      tag: "Admin",
    });
  }

  return blocks;
}

/* ================= PAGE ================= */

export default function GeneratePage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  /* Load tasks + prompt */
  useEffect(() => {
    try {
      const t = JSON.parse(localStorage.getItem(LS.tasks) || "[]");
      setTasks(Array.isArray(t) ? t : []);
    } catch {
      setTasks([]);
    }

    setUserPrompt(localStorage.getItem(LS.userPrompt) || "");
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

  function handleGenerate() {
    setLoading(true);
    localStorage.setItem(LS.userPrompt, userPrompt);

    setTimeout(() => {
      const blocks = generateSchedule(tasks, userPrompt);
      localStorage.setItem(LS.generated, JSON.stringify(blocks));
      router.push("/dashboard-preview");
    }, 700);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Generate schedule</div>
          <div className="text-xs text-white/50">
            Aurora uses your tasks to build a realistic plan
          </div>
        </div>
        <Button variant="ghost" onClick={() => router.push("/tasks")}>
          ← Tasks
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* User prompt */}
        <Card>
          <div className="space-y-3">
            <div className="text-sm font-semibold">Your instruction</div>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={8}
              placeholder="e.g. I have an exam tomorrow, focus more in the morning"
              className="w-full rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating…" : "Generate schedule →"}
            </Button>
          </div>
        </Card>

        {/* AI prompt preview */}
        <Card>
          <div className="space-y-3">
            <div className="text-sm font-semibold">AI prompt preview</div>
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
      </div>
    </div>
  );
}