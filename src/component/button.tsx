import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99]";
  const styles =
    variant === "primary"
      ? "bg-violet-600 text-white hover:bg-violet-500"
      : "bg-white/5 text-white hover:bg-white/10 border border-white/10";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}