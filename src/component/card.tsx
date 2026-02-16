import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/30 backdrop-blur ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}