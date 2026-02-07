"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

type BestTime = "morning" | "afternoon" | "night";

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
        active
          ? "border-violet-500/50 bg-violet-600 text-white"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function PreferencesPage() {
  const router = useRouter();

  // Preferences
  const [bestTime, setBestTime] = useState<BestTime>("morning");
  const [sleepHours, setSleepHours] = useState(7);
  const [focusHours, setFocusHours] = useState(4);
  const [rigor, setRigor] = useState(70);
  const [breakStyle, setBreakStyle] = useState<"light" | "balanced" | "strict">("balanced");

  // Simple preview text
  const preview = useMemo(() => {
    const blocks =
      rigor >= 75 ? "Long focus blocks" : rigor >= 45 ? "Medium focus blocks" : "Short focus blocks";
    const breaks =
      breakStyle === "strict" ? "More frequent breaks" : breakStyle === "light" ? "Fewer breaks" : "Balanced breaks";
    const time =
      bestTime === "morning" ? "Morning-first plan" : bestTime === "afternoon" ? "Afternoon-first plan" : "Night-first plan";

    return `${time} • ${blocks} • ${breaks} • ${focusHours}h focus/day • ${sleepHours}h sleep`;
  }, [bestTime, rigor, breakStyle, focusHours, sleepHours]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/onboarding/connect-tools")}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
        >
          ← Back
        </button>

        <div className="text-xs text-white/60">Onboarding • Step 2 of 3</div>
      </div>

      {/* Header */}
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-white/60">Preferences</div>
            <h1 className="mt-1 text-2xl font-bold">How do you want Aurora to plan?</h1>
            <p className="mt-1 text-sm text-white/60">
              These settings help Aurora generate a realistic schedule that matches your study style.
            </p>
          </div>

          {/* Progress */}
          <div className="h-2 w-full rounded-full bg-white/10">
            <div className="h-2 w-2/3 rounded-full bg-violet-600" />
          </div>

          {/* Preview */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">Preview</div>
            <div className="mt-1 text-sm font-semibold">{preview}</div>
          </div>
        </div>
      </Card>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: choices */}
        <Card>
          <div className="space-y-5">
            <div>
              <div className="text-sm font-semibold">Best study time</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Pill active={bestTime === "morning"} onClick={() => setBestTime("morning")}>
                  Morning
                </Pill>
                <Pill active={bestTime === "afternoon"} onClick={() => setBestTime("afternoon")}>
                  Afternoon
                </Pill>
                <Pill active={bestTime === "night"} onClick={() => setBestTime("night")}>
                  Night
                </Pill>
              </div>
              <p className="mt-2 text-xs text-white/50">
                Aurora will place your hardest tasks in this time window first.
              </p>
            </div>

            <Divider />

            <div>
              <div className="text-sm font-semibold">Break style</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Pill active={breakStyle === "light"} onClick={() => setBreakStyle("light")}>
                  Light
                </Pill>
                <Pill active={breakStyle === "balanced"} onClick={() => setBreakStyle("balanced")}>
                  Balanced
                </Pill>
                <Pill active={breakStyle === "strict"} onClick={() => setBreakStyle("strict")}>
                  Strict
                </Pill>
              </div>
              <p className="mt-2 text-xs text-white/50">
                Strict = more breaks, Light = fewer breaks.
              </p>
            </div>

            <Divider />

            <SliderRow
              label="Academic rigor"
              value={rigor}
              suffix="%"
              min={0}
              max={100}
              onChange={setRigor}
              hint="Higher rigor = longer focus blocks and earlier deadlines."
            />

            <SliderRow
              label="Daily focus capacity"
              value={focusHours}
              suffix="h"
              min={1}
              max={8}
              onChange={setFocusHours}
              hint="How many hours of focused work you can realistically do per day."
            />

            <SliderRow
              label="Sleep target"
              value={sleepHours}
              suffix="h"
              min={5}
              max={10}
              onChange={setSleepHours}
              hint="Aurora avoids scheduling heavy work too late if sleep is high."
            />
          </div>
        </Card>

        {/* Right: what Aurora will do */}
        <Card>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">What Aurora will optimize</div>
              <p className="mt-1 text-sm text-white/60">
                Based on your preferences, Aurora will build schedules that feel doable — not perfect on paper only.
              </p>
            </div>

            <ul className="space-y-3 text-sm text-white/70">
              <li className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">Avoid conflicts</div>
                <div className="text-white/60 text-sm">
                  Keeps class/events safe and schedules tasks around them.
                </div>
              </li>
              <li className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">Deadline-first planning</div>
                <div className="text-white/60 text-sm">
                  Breaks big tasks into steps and places them before due dates.
                </div>
              </li>
              <li className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">Burnout protection</div>
                <div className="text-white/60 text-sm">
                  Adds breaks and respects your daily focus limit.
                </div>
              </li>
            </ul>

            <Divider />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => router.push("/onboarding/review")}
                className="text-sm text-white/60 hover:text-white"
              >
                Skip for now
              </button>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => router.push("/onboarding/connect-tools")}>
                  Back
                </Button>
                <Button onClick={() => router.push("/onboarding/review")}>
                  Next →
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-xs text-white/40">
        Next: you’ll review choices and generate your first schedule.
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-white/10" />;
}

function SliderRow({
  label,
  value,
  suffix,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-white/60">
          {value}
          {suffix}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="text-xs text-white/50">{hint}</div>
    </div>
  );
}