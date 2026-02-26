
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TimePreference = "morning" | "afternoon" | "evening";
type Intensity = "light" | "balanced" | "intense";

type TaskInput = {
  title: string;
  minutes: number;
  priority: "high" | "medium" | "low";
};

type PreviewBlock = {
  title: string;
  start: string;
  end: string;
  type: "focus" | "break" | "personal";
  priority?: string;
};

type ScheduleBlockTag = "Deep Work" | "Break" | "Admin";

type ScheduleBlock = {
  title: string;
  start: string;
  end: string;
  tag: ScheduleBlockTag;
  priority?: string;
};

type ScheduleBlockFromApi = {
  title: string;
  start: string;
  end: string;
  tag: "Deep Work" | "Class" | "Break" | "Admin" | "Health";
  priority?: string;
};

type PreferencesPayload = {
  timePreference: TimePreference;
  intensity: Intensity;
  focusHours: number;
};

type SetupPayload = {
  preference: TimePreference;
  intensity: Intensity;
  focusHours: number;
  tasks: TaskInput[];
  preview: PreviewBlock[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toLocalIsoDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatOrdinal(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
}

function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  return `${monthLabel} ${formatOrdinal(day)}`;
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

  const blocks: PreviewBlock[] = [];

  let usedFocus = 0;

  const add = (title: string, dur: number, type: "focus" | "break" | "personal", priority?: string) => {
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

function mapPreviewTypeToTag(type: PreviewBlock["type"]): ScheduleBlockTag {
  if (type === "focus") return "Deep Work";
  if (type === "break") return "Break";
  return "Admin";
}

function mapScheduleTagToPreviewType(tag: ScheduleBlockFromApi["tag"]): PreviewBlock["type"] {
  if (tag === "Break") return "break";
  if (tag === "Deep Work") return "focus";
  return "personal";
}

function PreviewTimeline({
  blocks,
}: {
  blocks: PreviewBlock[];
}) {
  const sorted = [...blocks].sort((a, b) => a.start.localeCompare(b.start));

  const styleByType: Record<string, string> = {
    focus: "bg-gradient-to-br from-blue-500/85 to-indigo-600/85 border-blue-400/30",
    break: "bg-gradient-to-br from-emerald-500/85 to-teal-600/85 border-emerald-400/30",
    personal: "bg-gradient-to-br from-amber-500/85 to-orange-600/85 border-amber-400/30",
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10">
      <div className="max-h-[440px] overflow-y-auto px-4 py-4 space-y-3">
        {sorted.map((b, idx) => (
          <div key={`${b.title}-${idx}`} className="flex items-start gap-3">
            <div className="w-16 shrink-0 text-[11px] text-white/50 font-mono leading-4">
              <div>{b.start}</div>
              <div>{b.end}</div>
            </div>

            <div className={`flex-1 rounded-xl border p-3 shadow-lg ${styleByType[b.type]}`}>
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

export default function GetStartedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");
  const selectedDatesStr = searchParams.get("dates");
  const todayIso = useMemo(() => toLocalIsoDate(), []);
  const targetDates = useMemo(
    () => (selectedDatesStr ? selectedDatesStr.split(",") : [selectedDate ?? todayIso]),
    [selectedDatesStr, selectedDate, todayIso]
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [preference, setPreference] = useState<TimePreference>("morning");
  const [intensity, setIntensity] = useState<Intensity>("balanced");
  const [focusHours, setFocusHours] = useState(5);

  const [tasks, setTasks] = useState<TaskInput[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newMinutes, setNewMinutes] = useState(45);
  const [newPriority, setNewPriority] = useState<TaskInput["priority"]>("medium");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [schedulePreview, setSchedulePreview] = useState<PreviewBlock[] | null>(null);

  const preview = useMemo(
    () => schedulePreview ?? generateDayPreview(preference, intensity, focusHours, tasks),
    [schedulePreview, preference, intensity, focusHours, tasks]
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

  const saveAndGoDashboard = async () => {
    setSaving(true);
    setSaveError(null);

    const payload: SetupPayload = { preference, intensity, focusHours, tasks, preview };
    const preferences: PreferencesPayload = {
      timePreference: preference,
      intensity,
      focusHours,
    };

    const scheduleBlocks: ScheduleBlock[] = preview.map((b) => ({
      title: b.title,
      start: b.start,
      end: b.end,
      tag: mapPreviewTypeToTag(b.type),
      priority: b.priority,
    }));

    try {
      const existingProfileRes = await fetch("/api/profile");
      const existingProfile = existingProfileRes.ok ? await existingProfileRes.json() : null;

      const [profileRes, scheduleRes] = await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences,
            tools: existingProfile?.tools ?? null,
            scheduleDraft: payload,
          }),
        }),
        fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocks: scheduleBlocks,
            userPrompt: null,
            date: selectedDate ?? undefined,
          }),
        }),
      ]);

      if (!profileRes.ok || !scheduleRes.ok) {
        throw new Error("Save failed");
      }

      router.push("/dashboard-preview");
    } catch {
      setSaveError("Failed to save setup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadSchedulePreview() {
      try {
        const dateToFetch = selectedDatesStr ? targetDates[0] : selectedDate;
        const query = dateToFetch ? `?date=${encodeURIComponent(dateToFetch)}` : "";
        const res = await fetch(`/api/schedule${query}`);
        if (!res.ok) return;
        const data = await res.json();
        const blocks = data?.blocks;
        if (!active || !Array.isArray(blocks) || blocks.length === 0) {
          if (active) setSchedulePreview(null);
          return;
        }

        setSchedulePreview(
          blocks.map((b: ScheduleBlockFromApi) => ({
            title: b.title,
            start: b.start,
            end: b.end,
            type: mapScheduleTagToPreviewType(b.tag),
            priority: b.priority,
          }))
        );
      } catch {
        // ignore
      }
    }

    loadSchedulePreview();
    return () => {
      active = false;
    };
  }, [selectedDate, selectedDatesStr, targetDates]);

  useEffect(() => {
    const payload: SetupPayload = { preference, intensity, focusHours, tasks, preview };
    try {
      localStorage.setItem("aurora_setup", JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [preference, intensity, focusHours, tasks, preview]);

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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25"
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
                    onClick={() => {
                      const query = selectedDatesStr
                        ? `?dates=${encodeURIComponent(selectedDatesStr)}`
                        : `?date=${encodeURIComponent(selectedDate || todayIso)}`;
                      router.push(`/generate${query}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25"
                  >
                    Continue
                  </button>
                </div>

                {saveError && (
                  <div className="text-xs text-red-300">{saveError}</div>
                )}


              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-white/60">Live preview</div>
                  <div className="text-lg font-bold">
                    {selectedDatesStr
                      ? `Batch Plan (${targetDates.length} days)`
                      : selectedDate && selectedDate !== todayIso
                      ? formatDisplayDate(selectedDate)
                      : "Today’s schedule"}
                  </div>
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