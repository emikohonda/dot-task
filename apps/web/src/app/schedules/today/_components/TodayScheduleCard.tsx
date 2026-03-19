// apps/web/src/app/schedules/today/_components/TodayScheduleCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { Schedule } from "../page";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

type ScheduleStatus = Schedule["status"];

const statusConfig: Record<ScheduleStatus, { label: string; className: string }> = {
  TODO:      { label: "未着手", className: "bg-slate-100 text-slate-600" },
  DOING:     { label: "進行中", className: "bg-sky-100 text-sky-700" },
  HOLD:      { label: "保留",   className: "bg-amber-100 text-amber-700" },
  DONE:      { label: "完了",   className: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "中止",   className: "bg-rose-50 text-rose-400" },
};

// アクティブ時のボタンカラー
const buttonActiveColor: Record<"TODO" | "DOING" | "DONE", string> = {
  TODO:  "bg-slate-600 border-slate-600 text-white",
  DOING: "bg-sky-600 border-sky-600 text-white",
  DONE:  "bg-emerald-600 border-emerald-600 text-white",
};

// 時刻フォーマット（安全版）
function formatTimeRange(start?: string | null, end?: string | null): string {
  if (start && end) return `${start}〜${end}`;
  if (start) return start;
  return "時刻未設定";
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
  const [status, setStatus] = useState<ScheduleStatus>(schedule.status);
  const [saving, setSaving] = useState(false);

  const isCancelled = status === "CANCELLED";

  const onChangeStatus = async (next: ScheduleStatus) => {
    if (next === status || saving) return;
    const prev = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/schedules/${schedule.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setStatus(prev);
      alert("更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const employeeNames = schedule.employees.map((e) => e.employee.name).filter(Boolean);
  const contractorNames = schedule.contractors.map((c) => c.contractor.name).filter(Boolean);
  const timeLabel = formatTimeRange(schedule.startTime, schedule.endTime);
  const isTimed = !!schedule.startTime;

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
      <div className="flex items-center gap-2 min-w-0 mb-3">
        <span className={`shrink-0 text-sm font-medium ${isTimed ? "font-mono text-slate-500" : "text-slate-400"}`}>
          {timeLabel}
        </span>
        <span className={`text-base font-bold truncate ${isCancelled ? "line-through text-slate-400" : "text-slate-800"}`}>
          {schedule.title}
        </span>
      </div>

      {/* ステータス：3ボタン（未着手・進行中・完了）＋ select（保留・中止） */}
      <div className="relative flex flex-wrap items-center gap-2">
        {/* メイン3ボタン */}
        <div className="flex flex-1 gap-1.5">
          {(["TODO", "DOING", "DONE"] as const).map((st) => (
            <button
              key={st}
              type="button"
              disabled={saving}
              onClick={() => onChangeStatus(st)}
              className={[
                "flex-1 rounded-lg border h-11 px-3 text-sm font-semibold transition-all active:scale-95",
                status === st
                  ? buttonActiveColor[st]
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300",
              ].join(" ")}
            >
              {statusConfig[st].label}
            </button>
          ))}
        </div>

        {/* 保留・中止 select */}
        <div className="relative shrink-0">
          <select
            value={["HOLD", "CANCELLED"].includes(status) ? status : ""}
            onChange={(e) => {
              if (e.target.value) onChangeStatus(e.target.value as ScheduleStatus);
            }}
            disabled={saving}
            className={`rounded-lg border border-slate-200 bg-white h-11 min-w-[92px] px-3 text-sm font-medium transition-opacity ${
              saving ? "opacity-50" : "opacity-100"
            } ${["HOLD", "CANCELLED"].includes(status) ? "border-amber-300 text-amber-700 font-semibold" : "text-slate-500"}`}
          >
            <option value="">その他</option>
            <option value="HOLD">保留</option>
            <option value="CANCELLED">中止</option>
          </select>
          {/* スピナーオーバーレイ */}
          {saving && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40 pointer-events-none">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* 社員・協力会社 */}
      <div className="mt-3 space-y-2">
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
        <p className="mt-3 text-xs text-slate-500 line-clamp-2 border-t border-slate-100 pt-2">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
