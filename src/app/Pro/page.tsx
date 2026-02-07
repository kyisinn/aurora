"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getPlan, setPlan, Plan } from "@/lib/plan";

type ProFeature = {
  title: string;
  desc: string;
  badge: string;
};

export default function ProPage() {
  const router = useRouter();
  const [plan, setPlanState] = useState<Plan>("free");

  useEffect(() => {
    setPlanState(getPlan());
  }, []);

  const features: ProFeature[] = useMemo(() => ([
    { title: "AI Prompt → Schedule Builder", desc: "Turns user prompts into a realistic timeline with buffers & breaks.", badge: "AI" },
    { title: "Calendar Sync (Google)", desc: "Create events directly in Google Calendar (OAuth).", badge: "SYNC" },
    { title: "Auto Re-schedule", desc: "If you move one task, Aurora rebalances the day automatically.", badge: "SMART" },
    { title: "Focus Analytics", desc: "Track planned vs completed time blocks and improve weekly.", badge: "INSIGHTS" },
  ]), []);

  const goUpgrade = () => {
    setPlan("pro");
    setPlanState("pro");
  };

  const isPro = plan === "pro";

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="font-bold">Aurora</button>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/pricing")}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition"
            >
              Pricing
            </button>
            <button
              onClick={() => router.push("/billing")}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition"
            >
              Billing
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold">
              Pro Dashboard
              <span className="block text-lg text-white/60 font-medium mt-3">
                Unlock AI scheduling + calendar integration
              </span>
            </h1>
            <div className="text-sm text-white/60">
              Current plan:{" "}
              <span className="font-semibold text-white">{plan.toUpperCase()}</span>
            </div>
          </div>

          {!isPro ? (
            <button
              onClick={goUpgrade}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition font-semibold shadow-lg shadow-blue-500/25"
            >
              Activate Pro (demo)
            </button>
          ) : (
            <button
              onClick={() => router.push("/calendar-connect")}
              className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition font-semibold"
            >
              Connect Calendar
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-7 hover:border-white/20 transition">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">{f.title}</div>
                <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-200">
                  {f.badge}
                </span>
              </div>
              <p className="text-white/60 mt-3">{f.desc}</p>

              <div className="mt-5">
                <button
                  onClick={() => {
                    if (!isPro) return router.push("/pricing");
                    // route placeholders:
                    if (f.badge === "SYNC") return router.push("/calendar-connect");
                    return router.push("/get-started");
                  }}
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    isPro ? "bg-white/10 hover:bg-white/15 border border-white/15" :
                    "bg-white/5 border border-white/10 text-white/50"
                  }`}
                >
                  {isPro ? "Open" : "Upgrade to use"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 p-7">
          <div className="text-lg font-semibold">Next Pro step</div>
          <div className="text-white/60 mt-1">
            Add your prompts → generate schedule → export events to calendar.
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => router.push("/get-started")}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition font-semibold"
            >
              Generate AI schedule
            </button>
            <button
              onClick={() => router.push("/calendar-connect")}
              className="flex-1 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition font-semibold"
            >
              Export to calendar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}