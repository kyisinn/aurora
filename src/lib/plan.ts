export type Plan = "free" | "pro";

const KEY = "aurora_plan";

export function getPlan(): Plan {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem(KEY) as Plan) || "free";
}

export function setPlan(plan: Plan) {
  localStorage.setItem(KEY, plan);
}

export function isPro(): boolean {
  return getPlan() === "pro";
}