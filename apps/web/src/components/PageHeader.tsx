//apps/web/src/components/PageHeader.tsx
import * as React from "react";
import clsx from "clsx";

export function PageHeader({
  eyebrow,
  title,
  meta,
  right,
  note,
  hint,
  children,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  note?: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* 上段 */}
      <div
        className={clsx(
          "gap-3",
          align === "center"
            ? "flex flex-col items-center text-center"
            : "flex flex-wrap items-start justify-between"
        )}
      >
        <div className={clsx("min-w-0", align === "center" && "w-full")}>
          {eyebrow && (
            <p
              className={clsx(
                "text-xs text-slate-500",
                align === "center" && "text-center"
              )}
            >
              {eyebrow}
            </p>
          )}

          <div
            className={clsx(
              "mt-1 flex flex-wrap gap-2",
              align === "center"
                ? "items-center justify-center"
                : "items-center"
            )}
          >
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {meta}
          </div>

          {note && (
            <div
              className={clsx(
                "mt-1 text-xs text-slate-500",
                align === "center" && "text-center"
              )}
            >
              {note}
            </div>
          )}
        </div>

        {(hint || right) && (
          <div
            className={clsx(
              "flex flex-wrap items-center gap-2",
              align === "center" && "justify-center"
            )}
          >
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