"use client";

import { Card } from "@/component/card";
import { Button } from "@/component/button";
import { useRouter } from "next/navigation";

export default function GoogleSyncPage() {
  const router = useRouter();

  return (
    <main className="space-y-4">
      <Card>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Sync to Google Calendar</h1>
          <p className="text-sm text-white/60">
            This is UI now. Later we’ll connect Google OAuth and push events.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            Exporting will create events for your accepted schedule.
          </div>

          <Button onClick={() => alert("Google OAuth later")}>Start Google Sync</Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </Card>
    </main>
  );
}