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
          {title && (
            <div className="min-w-0 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-sky-600" />
              <h2 className="min-w-0 text-lg font-bold text-slate-900">{title}</h2>
            </div>
          )}
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}