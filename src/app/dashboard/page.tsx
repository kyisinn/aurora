"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/component/card";
import { Button } from "@/component/button";

type BlockTag = "Deep Work" | "Class" | "Break" | "Admin" | "Health";
type Block = { title: string; start: string; end: string; tag: BlockTag };

const LS_AUTH = "aurora:authed";

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function tagClass(tag: BlockTag) {
  const base = "rounded-full border px-2 py-0.5 text-[10px] font-semibold";
  if (tag === "Deep Work") return `${base} border-violet-500/30 bg-violet-500/10 text-violet-200`;
  if (tag === "Class") return `${base} border-sky-500/30 bg-sky-500/10 text-sky-200`;
  if (tag === "Break") return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-200`;
  if (tag === "Health") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-200`;
  return `${base} border-white/10 bg-white/5 text-white/70`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editing, setEditing] = useState(false);

  // 🔐 auth guard
  useEffect(() => {
    const authed = localStorage.getItem(LS_AUTH) === "true";
    if (!authed) {
      router.push("/login");
      return;
    }

    let active = true;

    async function loadSchedule() {
      try {
        const res = await fetch("/api/schedule");
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.blocks || !active) return;

        const parsed = data.blocks as Block[];
        parsed.sort((a, b) => toMin(a.start) - toMin(b.start));
        setBlocks(parsed);
      } catch {
        // ignore
      }
    }

    loadSchedule();
    return () => {
      active = false;
    };
  }, [router]);

  const deepCount = useMemo(
    () => blocks.filter((b) => b.tag === "Deep Work").length,
    [blocks]
  );

  async function saveSchedule() {
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, userPrompt: null }),
      });

      if (!res.ok) throw new Error("save failed");
      alert("Schedule saved ✅");
      setEditing(false);
    } catch {
      alert("Failed to save schedule.");
    }
  }

  function logout() {
    localStorage.removeItem(LS_AUTH);
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold">Aurora</div>
            <div className="text-[10px] text-white/50">Dashboard</div>
          </div>
        </button>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/generate")}>
            Regenerate
          </Button>
          {editing ? (
            <Button onClick={saveSchedule}>Save</Button>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          )}
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs text-white/60">Today</div>
          <div className="mt-1 text-2xl font-bold">{blocks.length} blocks</div>
          <div className="mt-1 text-sm text-white/60">{deepCount} deep sessions</div>
        </Card>

        <Card>
          <div className="text-xs text-white/60">Status</div>
          <div className="mt-1 text-2xl font-bold">Saved</div>
          <div className="mt-1 text-sm text-white/60">Database</div>
        </Card>

        <Card>
          <div className="text-xs text-white/60">Sync</div>
          <div className="mt-1 text-2xl font-bold">Ready</div>
          <div className="mt-1 text-sm text-white/60">Coming soon</div>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Today’s plan</div>
            <div className="text-xs text-white/60">
              {editing ? "Editing enabled" : "Read-only view"}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {blocks.map((b, idx) => (
            <div
              key={idx}
              className={`rounded-3xl border border-white/10 bg-black/20 p-4 ${
                editing ? "ring-1 ring-violet-500/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-full">
                  {editing ? (
                    <input
                      value={b.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setBlocks((prev) =>
                          prev.map((block, i) =>
                            i === idx ? { ...block, title } : block
                          )
                        );
                      }}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-sm"
                    />
                  ) : (
                    <div className="text-sm font-semibold">{b.title}</div>
                  )}

                  <div className="mt-1 text-xs text-white/60">
                    {b.start} – {b.end}
                  </div>
                </div>

                <span className={tagClass(b.tag)}>{b.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}