"use client";

import { Card } from "@/component/card";
import { Button } from "@/component/button";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <main className="space-y-4">
      <Card>
        <div className="space-y-2 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-violet-600 text-2xl">
            ✓
          </div>
          <h1 className="text-xl font-bold">You’re all set!</h1>
          <p className="text-sm text-white/60">
            Your first schedule is ready. You can regenerate or sync anytime.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          <Button variant="ghost" onClick={() => router.push("/onboarding/connect-tools")}>
            Edit onboarding
          </Button>
        </div>
      </Card>
    </main>
  );
}