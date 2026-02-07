import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/30 backdrop-blur">
      {children}
    </div>
  );
}