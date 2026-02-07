// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Card } from "@/component/card";
// import { Button } from "@/component/button";

// const GOALS = [
//   { id: "exam", title: "Prepare for exams", desc: "Create study blocks and revision plans." },
//   { id: "assignments", title: "Finish assignments", desc: "Split tasks into steps with deadlines." },
//   { id: "routine", title: "Build routines", desc: "Build habits in realistic time windows." },
//   { id: "balanced", title: "Balance everything", desc: "Study + health + breaks + life." },
// ];

// export default function GetStartedPage() {
//   const router = useRouter();
//   const [goal, setGoal] = useState("balanced");

//   return (
//     <div className="mx-auto max-w-4xl space-y-6 py-10">
//       <div className="space-y-2">
//         <h1 className="text-3xl font-bold">Get started</h1>
//         <p className="text-sm text-white/60">
//           Choose a focus, then we’ll set up your tools and preferences.
//         </p>
//       </div>

//       <div className="grid gap-3 md:grid-cols-2">
//         {GOALS.map((g) => (
//           <button
//             key={g.id}
//             onClick={() => setGoal(g.id)}
//             className={`rounded-3xl border p-5 text-left transition ${
//               goal === g.id
//                 ? "border-violet-500/50 bg-violet-500/10"
//                 : "border-white/10 bg-white/5 hover:bg-white/10"
//             }`}
//           >
//             <div className="text-sm font-semibold">{g.title}</div>
//             <div className="mt-1 text-sm text-white/60">{g.desc}</div>
//           </button>
//         ))}
//       </div>

//       <Card>
//         <div className="space-y-4">
//           <div>
//             <div className="text-sm font-semibold">Next steps</div>
//             <div className="text-sm text-white/60">
//               We’ll connect your tools and generate your first schedule.
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <Button variant="ghost" onClick={() => router.push("/")}>
//               Back
//             </Button>
//             {/* ✅ CONNECTS TO CONNECT-TOOLS PAGE */}
//             <Button onClick={() => router.push("/onboarding/connect-tools")}>
//               Continue
//             </Button>
//           </div>

//           <p className="text-xs text-white/40">
//             Selected focus: <span className="text-white">{goal}</span>
//           </p>
//         </div>
//       </Card>
//     </div>
//   );
// }
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TimePreference = "morning" | "afternoon" | "evening";
type Intensity = "light" | "balanced" | "intense";

type TaskInput = {
  title: string;
  minutes: number;
  priority: "high" | "medium" | "low";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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

  const blocks: { title: string; start: string; end: string; type: string; priority?: string }[] = [];

  let usedFocus = 0;

  const add = (title: string, dur: number, type: string, priority?: string) => {
    const start = cur;
    const end = cur + dur;
    blocks.push({ title, start: formatTime(start), end: formatTime(end), type, priority });
    cur = end;
  };

  // Warm up
  add("Plan & Setup", 10, "break");

  for (let i = 0; i < sorted.length; i++) {
    if (usedFocus >= maxFocusMin) break;

    const t = sorted[i];
    const dur = clamp(Math.round(t.minutes * intensityMult), 20, 180);
    const canFit = Math.min(dur, maxFocusMin - usedFocus);

    if (canFit < 20) break;

    add(t.title, canFit, "focus", t.priority);
    usedFocus += canFit;

    // smart break
    if (usedFocus < maxFocusMin) add("Break", 10, "break");
  }

  // Finish
  add("Wrap up & Review", 15, "personal");

  return blocks.slice(0, 10);
}

function PreviewTimeline({
  blocks,
}: {
  blocks: { title: string; start: string; end: string; type: string; priority?: string }[];
}) {
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const min = Math.min(...blocks.map((b) => parse(b.start)));
  const max = Math.max(...blocks.map((b) => parse(b.end)));
  const total = Math.max(1, max - min);

  const styleByType: Record<string, string> = {
    focus: "bg-gradient-to-br from-blue-500/85 to-indigo-600/85 border-blue-400/30",
    break: "bg-gradient-to-br from-emerald-500/85 to-teal-600/85 border-emerald-400/30",
    personal: "bg-gradient-to-br from-amber-500/85 to-orange-600/85 border-amber-400/30",
  };

  return (
    <div className="relative h-[440px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 overflow-hidden">
      <div className="absolute inset-0 opacity-15">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full border-t border-white/10"
            style={{ top: `${(i / 12) * 100}%` }}
          />
        ))}
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-900/90 to-transparent border-r border-white/5 flex flex-col justify-between py-4 px-2">
        {Array.from({ length: 8 }).map((_, i) => {
          const t = min + (i * total) / 7;
          const h = Math.floor(t / 60);
          return (
            <div key={i} className="text-[10px] text-white/40 font-mono text-right">
              {h > 12 ? h - 12 : h}
              {h >= 12 ? "pm" : "am"}
            </div>
          );
        })}
      </div>

      <div className="absolute left-16 right-4 top-0 bottom-0 py-4">
        {blocks.map((b, idx) => {
          const s = parse(b.start);
          const e = parse(b.end);
          const top = ((s - min) / total) * 100;
          const height = ((e - s) / total) * 100;

          return (
            <div
              key={idx}
              className={`absolute left-0 right-0 rounded-xl border p-3 backdrop-blur-sm shadow-lg ${styleByType[b.type]}`}
              style={{ top: `${top}%`, height: `${Math.max(height, 7)}%` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{b.title}</div>
                  <div className="text-[11px] text-white/70 mt-1">
                    {b.start} – {b.end}
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
          );
        })}
      </div>
    </div>
  );
}

export default function GetStartedPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [preference, setPreference] = useState<TimePreference>("morning");
  const [intensity, setIntensity] = useState<Intensity>("balanced");
  const [focusHours, setFocusHours] = useState(5);

  const [tasks, setTasks] = useState<TaskInput[]>([
    { title: "Assignment: Report Writing", minutes: 90, priority: "high" },
    { title: "Aurora: Build Get Started Flow", minutes: 60, priority: "high" },
    { title: "Review lecture notes", minutes: 45, priority: "medium" },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newMinutes, setNewMinutes] = useState(45);
  const [newPriority, setNewPriority] = useState<TaskInput["priority"]>("medium");

  const preview = useMemo(
    () => generateDayPreview(preference, intensity, focusHours, tasks),
    [preference, intensity, focusHours, tasks]
  );

  const canContinueStep1 = true;
  const canContinueStep2 = tasks.length > 0;

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) return;

    setTasks((prev) => [
      ...prev,
      {
        title,
        minutes: clamp(newMinutes, 15, 240),
        priority: newPriority,
      },
    ]);
    setNewTitle("");
    setNewMinutes(45);
    setNewPriority("medium");
  };

  const removeTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveAndGoDashboard = () => {
    // For now: store in localStorage (no backend needed)
    const payload = { preference, intensity, focusHours, tasks, preview };
    localStorage.setItem("aurora_setup", JSON.stringify(payload));
    router.push("/dashboard-preview");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-6xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Get started
              <span className="block text-white/60 text-lg font-medium mt-2">
                Tell Aurora your preferences, add tasks, and preview your schedule.
              </span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setStep(n as 1 | 2 | 3)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  step === n ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Step {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: Steps */}
          <div className="space-y-6">
            {/* Step tabs (mobile) */}
            <div className="md:hidden grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setStep(n as 1 | 2 | 3)}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                    step === n
                      ? "border-blue-500/50 bg-blue-500/20"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  Step {n}
                </button>
              ))}
            </div>

            {/* Step 1 */}
            <div className={`rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 ${step !== 1 ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm text-white/60">Step 1</div>
                  <div className="text-xl font-bold">Preferences</div>
                </div>
                {step !== 1 && (
                  <button className="text-sm text-blue-300 hover:text-blue-200" onClick={() => setStep(1)}>
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Time preference */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-white/80">Best time to focus</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["morning", "afternoon", "evening"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPreference(t)}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          preference === t
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {t === "morning" ? "🌅" : t === "afternoon" ? "☀️" : "🌙"}{" "}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-white/80">Intensity</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["light", "balanced", "intense"] as const).map((it) => (
                      <button
                        key={it}
                        onClick={() => setIntensity(it)}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                          intensity === it
                            ? "border-blue-500/50 bg-blue-500/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {it === "light" ? "🙂" : it === "balanced" ? "⚖️" : "🔥"}{" "}
                        {it.charAt(0).toUpperCase() + it.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus hours */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white/80">Focus hours/day</div>
                    <div className="text-sm font-bold text-blue-300">{focusHours}h</div>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={focusHours}
                    onChange={(e) => setFocusHours(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(79 70 229) ${
                        ((focusHours - 2) / 6) * 100
                      }%, rgba(255,255,255,0.12) ${((focusHours - 2) / 6) * 100}%, rgba(255,255,255,0.12) 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/40">
                    <span>2h</span>
                    <span>8h</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={!canContinueStep1}
                    onClick={() => setStep(2)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                  >
                    Continue to tasks
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 ${step !== 2 ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm text-white/60">Step 2</div>
                  <div className="text-xl font-bold">Add tasks</div>
                </div>
                {step !== 2 && (
                  <button className="text-sm text-blue-300 hover:text-blue-200" onClick={() => setStep(2)}>
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title (e.g., Study Chapter 5)"
                    className="md:col-span-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-blue-500/40"
                  />
                  <button
                    onClick={addTask}
                    className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-semibold py-3 text-sm transition-all"
                  >
                    + Add
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] text-white/50 mb-1">Minutes</div>
                    <input
                      type="number"
                      min={15}
                      max={240}
                      value={newMinutes}
                      onChange={(e) => setNewMinutes(Number(e.target.value))}
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] text-white/50 mb-2">Priority</div>
                    <div className="flex gap-2">
                      {(["high", "medium", "low"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setNewPriority(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            newPriority === p
                              ? p === "high"
                                ? "bg-red-500/20 border-red-500/40 text-red-200"
                                : p === "medium"
                                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                                : "bg-green-500/20 border-green-500/40 text-green-200"
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="hidden md:block rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[11px] text-white/50 mb-1">Tip</div>
                    <div className="text-sm text-white/70">
                      Add 3–6 tasks for best preview.
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {tasks.map((t, idx) => (
                    <div
                      key={`${t.title}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{t.title}</div>
                        <div className="text-xs text-white/50 mt-0.5">
                          {t.minutes} min • {t.priority}
                        </div>
                      </div>
                      <button
                        onClick={() => removeTask(idx)}
                        className="text-sm text-white/60 hover:text-white transition"
                        aria-label="Remove task"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-semibold py-3 transition"
                  >
                    Back
                  </button>
                  <button
                    disabled={!canContinueStep2}
                    onClick={() => setStep(3)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                  >
                    Preview schedule
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 ${step !== 3 ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm text-white/60">Step 3</div>
                  <div className="text-xl font-bold">Confirm & continue</div>
                </div>
                {step !== 3 && (
                  <button className="text-sm text-blue-300 hover:text-blue-200" onClick={() => setStep(3)}>
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-4 text-sm text-white/70">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white font-semibold mb-2">Your setup</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-white/50">Best time</div>
                      <div className="font-semibold text-white">{preference}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Intensity</div>
                      <div className="font-semibold text-white">{intensity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Focus hours</div>
                      <div className="font-semibold text-white">{focusHours}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/50">Tasks</div>
                      <div className="font-semibold text-white">{tasks.length}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-semibold py-3 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={saveAndGoDashboard}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                  >
                    Continue to dashboard
                  </button>
                </div>

                <div className="text-xs text-white/45">
                  This demo saves your setup to <span className="text-white/70">localStorage</span>.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-white/60">Live preview</div>
                  <div className="text-lg font-bold">Today’s schedule</div>
                </div>
                <div className="text-xs text-white/50">
                  {preference} • {intensity} • {focusHours}h
                </div>
              </div>

              <PreviewTimeline blocks={preview} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Tip: If you want the preview to include your real calendar events next, we can connect Google Calendar later.
            </div>
          </div>
        </div>

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(to right, rgb(59 130 246), rgb(79 70 229));
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
          }
        `}</style>
      </main>
    </div>
  );
}