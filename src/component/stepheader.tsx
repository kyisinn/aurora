export function StepHeader({
  title,
  subtitle,
  step,
  total,
}: {
  title: string;
  subtitle: string;
  step: number;
  total: number;
}) {
  const pct = Math.round((step / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>Onboarding</span>
        <span>
          {step}/{total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-violet-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="pt-2">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}