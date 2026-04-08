// apps/web/src/components/CardSection.tsx
"use client";

import * as React from "react";

export function CardSection({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="min-w-0 text-lg font-bold text-slate-900">{title}</h2>}
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}