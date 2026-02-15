"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

type ToolKey = "google" | "notion" | "canvas";

type ProfilePayload = {
  preferences?: Record<string, unknown> | null;
  tools?: Record<ToolKey, boolean> | null;
  scheduleDraft?: unknown | null;
};

const defaultTools: Record<ToolKey, boolean> = {
  google: true,
  notion: false,
  canvas: false,
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70">
      {children}
    </span>
  );
}

function StepRow({
  title,
  desc,
  status,
}: {
  title: string;
  desc: string;
  status: "ok" | "skip";
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-white/60">{desc}</div>
      </div>
      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          status === "ok"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            : "border-white/10 bg-white/5 text-white/60"
        }`}
      >
        {status === "ok" ? "Ready" : "Optional"}
      </span>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfilePayload>({});
  const [tools, setTools] = useState<Record<ToolKey, boolean>>(defaultTools);

  const connectedCount = Object.values(tools).filter(Boolean).length;

  const summary = useMemo(() => {
    const connected = Object.entries(tools)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return connected.length ? connected.join(", ") : "none";
  }, [tools]);

  async function generateDemoSchedule() {
    await saveProfile(tools);
    router.push("/generate");
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !active) return;

        setProfile(data);
        if (data.tools) setTools(data.tools as Record<ToolKey, boolean>);
      } catch {
        // ignore
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(nextTools: Record<ToolKey, boolean>) {
    try {
      const payload = {
        preferences: profile.preferences ?? null,
        tools: nextTools,
        scheduleDraft: profile.scheduleDraft ?? null,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;
      const data = await res.json();
      setProfile(data);
    } catch {
      // ignore
    }
  }

  function updateTools(next: Record<ToolKey, boolean>) {
    setTools(next);
    void saveProfile(next);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/onboarding/preferences")}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
        >
          ← Back
        </button>

        <div className="text-xs text-white/60">Onboarding • Step 3 of 3</div>
      </div>

      {/* Header */}
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-white/60">Review</div>
            <h1 className="mt-1 text-2xl font-bold">Ready to generate your first plan</h1>
            <p className="mt-1 text-sm text-white/60">
              Quick check — you can always change these later in Settings.
            </p>
          </div>

          {/* Progress */}
          <div className="h-2 w-full rounded-full bg-white/10">
            <div className="h-2 w-full rounded-full bg-violet-600" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill>Connected tools: {connectedCount}/3</Pill>
            <Pill>Sync: {summary}</Pill>
            <Pill>Plan type: Balanced</Pill>
          </div>
        </div>
      </Card>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: checklist */}
        <Card>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">Checklist</div>
              <p className="mt-1 text-sm text-white/60">
                Aurora will generate a realistic schedule using these inputs.
              </p>
            </div>

            <div className="space-y-3">
              <StepRow
                title="Tools connected"
                desc="Calendar/tasks sources to prevent conflicts."
                status={connectedCount > 0 ? "ok" : "skip"}
              />
              <StepRow
                title="Preferences set"
                desc="Best study time, focus limit, breaks, and rigor."
                status="ok"
              />
              <StepRow
                title="Ready to generate"
                desc="Aurora will build your plan and show it on the dashboard."
                status="ok"
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Tip</div>
              <div className="mt-1 text-sm text-white/60">
                If you connect Google Calendar, Aurora can avoid scheduling tasks on top of classes or meetings.
              </div>
            </div>
          </div>
        </Card>

        {/* Right: actions */}
        <Card>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">Generate your first schedule</div>
              <p className="mt-1 text-sm text-white/60">
                This will create a sample plan you can edit later. No data is permanently saved until you sign in.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Google Calendar</div>
                <Toggle
                  on={tools.google}
                  onToggle={() => updateTools({ ...tools, google: !tools.google })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Notion</div>
                <Toggle
                  on={tools.notion}
                  onToggle={() => updateTools({ ...tools, notion: !tools.notion })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Canvas</div>
                <Toggle
                  on={tools.canvas}
                  onToggle={() => updateTools({ ...tools, canvas: !tools.canvas })}
                />
              </div>

              <div className="text-xs text-white/45">
                (Demo) These toggles simulate “use these sources”. Later you’ll integrate real OAuth/sync.
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-white/60 hover:text-white"
              >
                Skip & go home
              </button>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => router.push("/onboarding/preferences")}>
                  Back
                </Button>
                <Button onClick={generateDemoSchedule}>Generate schedule →</Button>
              </div>
            </div>

            <div className="text-xs text-white/40">
      
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-7 w-12 rounded-full border transition ${
        on ? "border-violet-500/40 bg-violet-600" : "border-white/15 bg-white/10"
      }`}
      aria-label="toggle"
    >
      <span
        className={`absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white transition ${
          on ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}