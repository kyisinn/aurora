"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

const GOALS = [
  { id: "exam", title: "Prepare for exams", desc: "Create study blocks and revision plans." },
  { id: "assignments", title: "Finish assignments", desc: "Split tasks into steps with deadlines." },
  { id: "routine", title: "Build routines", desc: "Build habits in realistic time windows." },
  { id: "balanced", title: "Balance everything", desc: "Study + health + breaks + life." },
];

export default function GetStartedPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("balanced");

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Get started</h1>
        <p className="text-sm text-white/60">
          Choose a focus, then we’ll set up your tools and preferences.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={`rounded-3xl border p-5 text-left transition ${
              goal === g.id
                ? "border-violet-500/50 bg-violet-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="text-sm font-semibold">{g.title}</div>
            <div className="mt-1 text-sm text-white/60">{g.desc}</div>
          </button>
        ))}
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold">Next steps</div>
            <div className="text-sm text-white/60">
              We’ll connect your tools and generate your first schedule.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" onClick={() => router.push("/")}>
              Back
            </Button>
            {/* ✅ CONNECTS TO CONNECT-TOOLS PAGE */}
            <Button onClick={() => router.push("/onboarding/connect-tools")}>
              Continue
            </Button>
          </div>

          <p className="text-xs text-white/40">
            Selected focus: <span className="text-white">{goal}</span>
          </p>
        </div>
      </Card>
    </div>
  );
}