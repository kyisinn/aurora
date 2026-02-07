"use client";

import { Card } from "@/component/card";
import { Button } from "@/component/button";
import { generateMockSchedule } from "@/lib/mock";
import { loadProfile, updateScheduleDraft } from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function SchedulerPage() {
  const router = useRouter();

  function onGenerate() {
    // later: call your AI API route and build a real plan
    const schedule = generateMockSchedule();
    updateScheduleDraft(schedule);
    router.push("/dashboard");
  }

  const p = typeof window !== "undefined" ? loadProfile() : null;

  return (
    <main className="space-y-4">
      <Card>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">What are we planning today?</h1>
          <p className="text-sm text-white/60">
            Aurora will propose a schedule based on your preferences and connected tools.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Your planning profile</div>
            <div className="mt-1 text-xs text-white/60">
              Best time: {p?.preferences.studyTime} • Focus: {p?.preferences.focusBlocks} hrs •
              Rigor: {p?.preferences.academicRigor}%
            </div>
          </div>

          <Button onClick={onGenerate}>Generate Schedule</Button>
          <Button variant="ghost" onClick={() => router.push("/onboarding/review")}>
            Back
          </Button>
        </div>
      </Card>
    </main>
  );
}