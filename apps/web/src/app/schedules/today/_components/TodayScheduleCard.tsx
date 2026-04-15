// apps/web/src/app/schedules/today/_components/TodayScheduleCard.tsx
"use client";

import Link from "next/link";
import type { Schedule } from "./TodayPageContent";

// 時刻フォーマット（安全版）
function formatTimeRange(start?: string | null, end?: string | null): string {
  if (start && end) return `${start}〜${end}`;
  if (start) return start;
  if (end) return end;
  return "終日";
}

// 社員名：2名まで表示、残りは「ほかN名」
function formatNameTags(names: string[]): string[] {
  if (names.length <= 2) return names;
  return [...names.slice(0, 2), `ほか${names.length - 2}名`];
}

function NameTag({ name, color = "slate" }: { name: string; color?: "sky" | "slate" }) {
  const cls =
    color === "sky"
      ? "bg-sky-50 text-sky-700 border border-sky-200"
      : "bg-slate-100 text-slate-600 border border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${cls}`}>
      {name}
    </span>
  );
}

export default function TodayScheduleCard({ schedule }: { schedule: Schedule }) {
  const isCancelled = schedule.status === "CANCELLED";

  const employeeNames = (schedule.employees ?? [])
    .map((e) => e.employee.name)
    .filter(Boolean);

  const contractorNames = (schedule.contractors ?? [])
    .map((c) => c.contractor.name)
    .filter(Boolean);

  const timeLabel = formatTimeRange(schedule.startTime, schedule.endTime);
  const isTimed = !!schedule.startTime || !!schedule.endTime;
  const titleLabel = schedule.title?.trim() ? schedule.title : "作業内容未入力";

  return (
    <div
      className={[
        "rounded-xl border p-4 transition",
        isCancelled
          ? "border-slate-100 bg-slate-50 opacity-60"
          : "border-slate-200 bg-white hover:shadow-sm",
      ].join(" ")}
    >
      {/* ヘッダー：時刻 ＋ タイトル */}
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <span
          className={`shrink-0 text-sm font-medium ${
            isTimed ? "font-mono text-slate-500" : "text-slate-400"
          }`}
        >
          {timeLabel}
        </span>
        <span
          className={`truncate text-base font-bold ${
            isCancelled ? "text-slate-400 line-through" : "text-slate-800"
          }`}
        >
          {titleLabel}
        </span>
      </div>

      {/* 社員・協力会社 */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-14 shrink-0 text-sm text-slate-500">社員</span>
          {employeeNames.length > 0 ? (
            formatNameTags(employeeNames).map((name, i) => (
              <NameTag key={`emp-${name}-${i}`} name={name} color={i < 2 ? "sky" : "slate"} />
            ))
          ) : (
            <span className="text-sm text-slate-400">未設定</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-14 shrink-0 text-sm text-slate-500">協力会社</span>
          {contractorNames.length > 0 ? (
            formatNameTags(contractorNames).map((name, i) => (
              <NameTag key={`con-${name}-${i}`} name={name} />
            ))
          ) : (
            <span className="text-sm text-slate-400">未設定</span>
          )}
        </div>
      </div>

      {/* メモ */}
      {schedule.description && (
        <p className="mt-3 line-clamp-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
          {schedule.description}
        </p>
      )}

      {/* 詳細リンク：全幅・押しやすい */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <Link
          href={`/schedules/${schedule.id}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 active:bg-sky-200"
        >
          詳細を見る
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}