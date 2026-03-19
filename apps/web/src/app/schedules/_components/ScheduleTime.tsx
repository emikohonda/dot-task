// apps/web/src/app/schedules/_components/ScheduleTime.tsx
export function ScheduleTime({
  startTime,
  endTime,
  variant = "list",
}: {
  startTime?: string | null;
  endTime?: string | null;
  variant?: "list" | "detail";
}) {
  const s = (startTime ?? "").trim();
  const e = (endTime ?? "").trim();

  // start/end 両方なし = 終日
  if (!s && !e) {
    return (
      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
        終日
      </span>
    );
  }

  // list は少し小さめ、detail は通常（お好みで統一してもOK）
  const cls =
    variant === "list"
      ? "text-sm font-medium text-slate-700"
      : "text-sm font-medium text-slate-800";

  // start のみ
  if (s && !e) return <span className={cls}>{s}</span>;

  // start + end
  if (s && e) {
    return (
      <span className={`inline-flex items-center ${cls}`}>
        <span>{s}</span>
        <span className="mx-1 text-slate-400">〜</span>
        <span>{e}</span>
      </span>
    );
  }

  // endのみ
  return <span className={cls}>{e}</span>;
}