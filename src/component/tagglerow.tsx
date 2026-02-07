"use client";

export function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/60">{desc}</div>
      </div>

      <button
        onClick={() => onChange(!checked)}
        className={`h-8 w-14 rounded-full border transition ${
          checked ? "bg-violet-600 border-violet-500" : "bg-white/10 border-white/10"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`block h-7 w-7 translate-x-0 rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}