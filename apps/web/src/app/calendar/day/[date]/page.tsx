// apps/web/src/app/calendar/day/[date]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, MapPin, User, Building2, ChevronLeft } from "lucide-react";
import { STATUS_META } from "@/lib/scheduleStatus";
import type { Schedule } from "@/lib/fetchers/schedules";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

function formatDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(startTime: string | null, endTime: string | null): string {
  if (!startTime) return "終日";
  if (!endTime) return startTime;
  return `${startTime} 〜 ${endTime}`;
}

function contractorLabel(s: Schedule): string | null {
  const names = s.contractors
    ?.map((x) => x.contractor?.name ?? null)
    .filter((n): n is string => Boolean(n?.trim())) ?? [];
  return names.length ? names.join(" / ") : null;
}

function employeesLabel(s: Schedule): string | null {
  const names = s.employees
    ?.map((x) => x.employee?.name ?? null)
    .filter((n): n is string => Boolean(n?.trim())) ?? [];
  return names.length ? names.join(" / ") : null;
}

async function fetchDaySchedules(date: string): Promise<Schedule[]> {
  try {
    const params = new URLSearchParams({ date, limit: "100" });
    const res = await fetch(`${API_BASE}/schedules?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

type Props = {
  params: { date: string };
};

export default async function CalendarDayPage({ params }: Props) {
  const { date } = params;

  // YYYY-MM-DD バリデーション
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const schedules = await fetchDaySchedules(date);
  const dateLabel = formatDateLabel(date);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href="/calendar"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="カレンダーに戻る"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-slate-500">カレンダー</p>
          <h1 className="text-lg font-bold text-slate-900">{dateLabel}</h1>
        </div>
      </div>

      {/* 予定一覧 */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {schedules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-900">この日は予定がありません</p>
            <Link
              href={`/schedules/new?date=${date}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              ＋ 予定を追加
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm text-slate-500">{schedules.length}件</p>
              <Link
                href={`/schedules/new?date=${date}`}
                className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
              >
                ＋ 予定を追加
              </Link>
            </div>

            <ul className="divide-y divide-slate-100">
              {schedules.map((s) => {
                const meta = STATUS_META[s.status];
                const cancelled = !!meta.isCancelled;
                const empText = employeesLabel(s);
                const conText = contractorLabel(s);

                return (
                  <li key={s.id}>
                    <Link
                      href={`/schedules/${s.id}`}
                      className={[
                        "block px-4 py-4 transition-colors hover:bg-slate-50",
                        cancelled ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* 左：情報 */}
                        <div className="min-w-0 flex-1">
                          {/* タイトル */}
                          <p
                            className={[
                              "font-bold text-[18px] leading-snug text-slate-900",
                              cancelled ? "line-through text-slate-400" : "",
                            ].join(" ")}
                          >
                            {s.title}
                          </p>

                          {/* 現場名 */}
                          {s.site?.name && (
                            <p className="mt-1 flex items-center gap-1.5 font-semibold text-[16px] leading-6 text-slate-700">
                              <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                              {s.site.name}
                            </p>
                          )}

                          {/* 時刻 */}
                          <p className="mt-0.5 flex items-center gap-1.5 text-[15px] text-slate-500">
                            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                            {formatTime(s.startTime ?? null, s.endTime ?? null)}
                          </p>

                          {/* 担当者 */}
                          {empText && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-600">
                              <User className="h-4 w-4 shrink-0 text-slate-400" />
                              {empText}
                            </p>
                          )}

                          {/* 協力会社 */}
                          {conText && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-600">
                              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                              {conText}
                            </p>
                          )}
                        </div>

                        {/* 右：ステータスバッジ */}
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
