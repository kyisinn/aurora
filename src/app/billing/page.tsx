"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlan, setPlan, Plan } from "@/lib/plan";

export default function BillingPage() {
  const router = useRouter();
  const [plan, setPlanState] = useState<Plan>("free");

  useEffect(() => setPlanState(getPlan()), []);

  const upgrade = () => { setPlan("pro"); setPlanState("pro"); };
  const cancel = () => { setPlan("free"); setPlanState("free"); };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="font-bold">Aurora</button>
          <button
            onClick={() => router.push("/pro")}
            className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition"
          >
            Back to Pro
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Billing</h1>
          <p className="text-white/60 mt-2">
            Manage your plan (demo). Later you can connect Stripe here.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Current Plan</div>
              <div className="text-2xl font-bold">{plan.toUpperCase()}</div>
            </div>
            <div className="text-sm text-white/60 text-right">
              {plan === "pro" ? "Renews monthly" : "No billing"}
            </div>
          </div>

          {plan !== "pro" ? (
            <button
              onClick={upgrade}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition font-semibold"
            >
              Upgrade to Pro (demo)
            </button>
          ) : (
            <button
              onClick={cancel}
              className="w-full py-3 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/15 transition font-semibold"
            >
              Cancel Pro (demo)
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">Pro includes</div>
          <ul className="mt-3 space-y-2 text-white/70 list-disc pl-5">
            <li>Unlimited prompts & tasks</li>
            <li>AI schedule generation with breaks/buffers</li>
            <li>Google Calendar sync (create events)</li>
            <li>Auto rescheduling</li>
            <li>Analytics dashboard</li>
          </ul>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/calendar-connect")}
              className="flex-1 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition font-semibold"
            >
              Connect Calendar
            </button>
            <button
              onClick={() => router.push("/get-started")}
              className="flex-1 py-3 rounded-xl bg-white text-blue-700 hover:bg-white/90 transition font-semibold"
            >
              Generate schedule
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}