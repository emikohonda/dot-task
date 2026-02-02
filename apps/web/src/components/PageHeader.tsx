import * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  meta,
  right,
  note,
  hint,
  children,
}: {
  eyebrow?: string;
  title: string;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  note?: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* 上段 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs text-slate-500">{eyebrow}</p>}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {meta}
          </div>

          {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
        </div>

        {(hint || right) && (
          <div className="flex flex-wrap items-center gap-2">
            {hint && <div className="text-xs text-slate-500">{hint}</div>}
            {right && <div className="shrink-0">{right}</div>}
          </div>
        )}
      </div>

      {/* 下段（フィルタ/操作エリア） */}
      {children ? (
        <div className="mt-4 border-t border-slate-100 pt-4">{children}</div>
      ) : null}
    </section>
  );
}