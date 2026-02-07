"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";
import Link from "next/link";




type DemoBlock = { title: string; start: string; end: string; tag: string };

function tagClass(tag: string) {
  const base = "rounded-full border px-2 py-0.5 text-[10px] font-semibold";
  if (tag === "Deep Work") return `${base} border-violet-500/30 bg-violet-500/10 text-violet-200`;
  if (tag === "Class") return `${base} border-sky-500/30 bg-sky-500/10 text-sky-200`;
  if (tag === "Break") return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`;
  if (tag === "Health") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-200`;
  return `${base} border-white/10 bg-white/5 text-white/70`;
}

function makeDemo(bestTime: "morning" | "afternoon" | "night", focusHours: number, rigor: number) {
  const deepBlock = rigor >= 75 ? 120 : rigor >= 45 ? 90 : 60;
  const totalFocusMin = Math.max(60, Math.min(8, focusHours) * 60);
  const blocks: DemoBlock[] = [];

  const start = bestTime === "morning" ? "09:00" : bestTime === "afternoon" ? "13:30" : "19:00";

  const minutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const hhmm = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const pad = (x: number) => String(x).padStart(2, "0");
    return `${pad(h)}:${pad(m)}`;
  };

  let cur = minutes(start);
  let used = 0;

  const add = (title: string, start: string, end: string, tag: string) =>
    blocks.push({ title, start, end, tag });

  const addDeep = (title: string) => {
    const dur = Math.min(deepBlock, totalFocusMin - used);
    if (dur <= 0) return;
    add(title, hhmm(cur), hhmm(cur + dur), "Deep Work");
    cur += dur;
    used += dur;
  };

  const addBreak = (dur: number) => {
    add("Break", hhmm(cur), hhmm(cur + dur), "Break");
    cur += dur;
  };

  add("Morning routine", "07:30", "08:00", "Health");
  add("Class (example)", "11:00", "12:15", "Class");
  addDeep("Study: Reading + Notes");
  addBreak(10);
  addDeep("Project: Build Aurora");
  addBreak(15);
  if (totalFocusMin - used >= 30) add("Admin: Quick tasks", hhmm(cur), hhmm(cur + 30), "Admin");

  return blocks.slice(0, 7);
}

export default function AuroraWebsiteHome() {
  const router = useRouter();
  const [bestTime, setBestTime] = useState<"morning" | "afternoon" | "night">("morning");
  const [focusHours, setFocusHours] = useState(4);
  const [rigor, setRigor] = useState(70);

  const demo = useMemo(() => makeDemo(bestTime, focusHours, rigor), [bestTime, focusHours, rigor]);
  <Button onClick={() => router.push("/get-started")}>
  Get started
</Button>


  return (
    
    <div className="space-y-16">
      {/* HERO + DEMO */}
      <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
        {/* Left */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            ⚡ Structured-style scheduling
          </div>

          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Plan your day with <span className="text-violet-400">Aurora AI</span>
          </h1>

          <p className="text-base text-white/60">
            Turn your time blocks, assignments, and exams into a realistic schedule —
            with breaks included and focus limits respected.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-56">
              <Button onClick={() => router.push("/onboarding/connect-tools")}>
                Get started
              </Button>
            </div>
            <div className="sm:w-44">
              <Button variant="ghost" onClick={() => router.push("/login")}>
                Sign in
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Fast setup</div>
              <div className="text-xs text-white/60">Under 2 minutes</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Breaks included</div>
              <div className="text-xs text-white/60">Realistic plans</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Calendar-ready</div>
              <div className="text-xs text-white/60">Google sync</div>
            </div>
          </div>
        </div>

        {/* Right: interactive demo */}
        <Card>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">Live demo</div>
              <div className="text-xs text-white/60">
                Adjust preferences to preview the schedule style.
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["morning", "afternoon", "night"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBestTime(t)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    bestTime === t
                      ? "border-violet-500 bg-violet-600"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {t === "morning" ? "Morning" : t === "afternoon" ? "Afternoon" : "Night"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Academic rigor</span>
                  <span>{rigor}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={rigor}
                  onChange={(e) => setRigor(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Focus hours/day</span>
                  <span>{focusHours}h</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={focusHours}
                  onChange={(e) => setFocusHours(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              {demo.map((b, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{b.title}</div>
                      <div className="mt-1 text-xs text-white/60">
                        {b.start} – {b.end}
                      </div>
                    </div>
                    <span className={tagClass(b.tag)}>{b.tag}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button onClick={() => router.push("/login")}>Save 🔒</Button>
              <Button variant="ghost" onClick={() => router.push("/login")}>
                Sync 🔒
              </Button>
            </div>

            <p className="text-xs text-white/40">
              Preview only — sign in to save, edit, and sync your real schedule.
            </p>
          </div>
        </Card>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="space-y-4">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">1) Add your time</div>
            <div className="mt-2 text-sm text-white/60">
              Wake/sleep, classes, part-time work, and free blocks.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">2) Add tasks & exams</div>
            <div className="mt-2 text-sm text-white/60">
              Deadlines, estimated durations, and priorities.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold">3) Generate plan</div>
            <div className="mt-2 text-sm text-white/60">
              Aurora creates a realistic schedule with breaks included.
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="space-y-4">
        <h2 className="text-2xl font-bold">Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Deadline-first", "Exams and urgent tasks come first."],
            ["Focus limits", "No impossible schedules."],
            ["Breaks included", "Burnout prevention by design."],
            ["Calendar sync", "Export to Google Calendar."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">{t}</div>
              <div className="mt-2 text-sm text-white/60">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="space-y-4">
        <h2 className="text-2xl font-bold">Pricing</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Free</div>
            <div className="mt-1 text-sm text-white/60">Get started with basics</div>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li>• Demo planning</li>
              <li>• Basic routines</li>
              <li>• Manual adjustments</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-6">
            <div className="text-lg font-semibold">Premium</div>
            <div className="mt-1 text-sm text-white/70">AI planning + sync</div>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• AI schedule generation</li>
              <li>• Google Calendar sync</li>
              <li>• Smart priorities</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="space-y-4">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Does Aurora replace Google Calendar?", "No — Aurora generates a plan and syncs it to your calendar."],
            ["Is it realistic?", "Yes — breaks are included and focus capacity is respected."],
            ["Can I edit schedules?", "Yes — you can edit tasks and regenerate anytime."],
            ["When should I sign in?", "Sign in when you want to save, sync, and personalize."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">{q}</div>
              <div className="mt-2 text-sm text-white/60">{a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}