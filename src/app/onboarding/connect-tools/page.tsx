
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

type ToolKey = "google" | "notion" | "canvas";
type ToolItem = {
  key: ToolKey;
  title: string;
  desc: string;
  statusHint: string;
  badge?: string;
};

function StatusPill({ on }: { on: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        on
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-white/60"
      }`}
    >
      {on ? "Connected" : "Not connected"}
    </span>
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

export default function ConnectToolsPage() {
  const router = useRouter();

  const [tools, setTools] = useState<Record<ToolKey, boolean>>({
    google: true,
    notion: false,
    canvas: false,
  });

  const toolItems: ToolItem[] = useMemo(
    () => [
      {
        key: "google",
        title: "Google Calendar",
        desc: "Avoid conflicts by syncing your events and exporting Aurora schedules.",
        statusHint: "Reads existing events; exports scheduled blocks.",
        badge: "Recommended",
      },
      {
        key: "notion",
        title: "Notion",
        desc: "Pull tasks, deadlines, and project notes into Aurora.",
        statusHint: "Reads selected pages; you choose what to sync.",
      },
      {
        key: "canvas",
        title: "Canvas",
        desc: "Bring in assignments and exam dates from your courses.",
        statusHint: "Imports course deadlines to generate study blocks.",
      },
    ],
    []
  );

  const connectedCount = Object.values(tools).filter(Boolean).length;
  const progress = 1; // step 1 of 3

  const toggle = (k: ToolKey) => setTools((p) => ({ ...p, [k]: !p[k] }));

  function connectNow(k: ToolKey) {
    // Real app: OAuth/Integration flow
    // Website-realistic: simulate “connect”
    setTools((p) => ({ ...p, [k]: true }));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/get-started")}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
        >
          ← Back
        </button>

        <div className="text-xs text-white/60">
          Onboarding • Step {progress} of 3
        </div>
      </div>

      {/* Header */}
      <Card>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs text-white/60">Connect tools</div>
              <h1 className="mt-1 text-2xl font-bold">Connect your world</h1>
              <p className="mt-1 text-sm text-white/60">
                Link tools so Aurora can create schedules that fit your real life.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              Connected:{" "}
              <span className="text-white font-semibold">{connectedCount}</span>/3
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-white/10">
            <div className="h-2 w-1/3 rounded-full bg-violet-600" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MiniInfo
              title="Fast setup"
              desc="Connect only what you need"
            />
            <MiniInfo
              title="Privacy first"
              desc="You choose what to sync"
            />
            <MiniInfo
              title="No conflicts"
              desc="Avoid overlapping events"
            />
          </div>
        </div>
      </Card>

      {/* Tools list */}
      <div className="grid gap-3">
        {toolItems.map((t) => {
          const on = tools[t.key];
          return (
            <Card key={t.key}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold">{t.title}</div>
                    {t.badge ? (
                      <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                        {t.badge}
                      </span>
                    ) : null}
                    <StatusPill on={on} />
                  </div>

                  <p className="text-sm text-white/60">{t.desc}</p>
                  <p className="text-xs text-white/45">{t.statusHint}</p>
                </div>

                <div className="flex items-center gap-3">
                  {!on ? (
                    <button
                      onClick={() => connectNow(t.key)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                    >
                      Connect
                    </button>
                  ) : (
                    <button
                      onClick={() => setTools((p) => ({ ...p, [t.key]: false }))}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                    >
                      Disconnect
                    </button>
                  )}

                  <Toggle on={on} onToggle={() => toggle(t.key)} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom actions */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/onboarding/preferences")}
            className="text-sm text-white/60 hover:text-white"
          >
            Set up later
          </button>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.push("/get-started")}>
              Back
            </Button>

            <Button onClick={() => router.push("/onboarding/preferences")}>
              Next →
            </Button>
          </div>
        </div>
      </Card>

      <div className="text-xs text-white/40">
        Tip: Connecting Google Calendar is the best way to prevent schedule conflicts.
      </div>
    </div>
  );
}

function MiniInfo({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/60">{desc}</div>
    </div>
  );
}