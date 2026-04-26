// apps/web/src/app/calendar/day/[date]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ChevronLeft } from "lucide-react";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import type { Schedule } from "@/lib/fetchers/schedules";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

function isValidYmd(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

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

function formatTimeBlock(s: Schedule): { line1: string; line2: string } {
  if (!s.startTime) return { line1: "終日", line2: "" };
  return { line1: s.startTime, line2: s.endTime ?? "" };
}

function companyName(s: Schedule): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (s.site as any)?.company?.name ?? "元請未設定";
}

async function fetchDaySchedules(date: string): Promise<Schedule[]> {
  try {
    const params = new URLSearchParams({ dateFrom: date, dateTo: date, limit: "100" });
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
  params: Promise<{ date: string }>;
};

export default async function CalendarDayPage({ params }: Props) {
  const { date } = await params;

  if (!isValidYmd(date)) notFound();

  const schedules = await fetchDaySchedules(date);
  const dateLabel = formatDateLabel(date);

  return (
    <div className="relative space-y-3">

      {/* ヘッダー：戻るボタン + 日付 + 件数 */}
      <div className="flex items-center gap-3">
        <Link
          href="/calendar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="カレンダーに戻る"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold text-slate-900">{dateLabel}</h1>
          <span className="text-sm text-slate-400">{schedules.length}件</span>
        </div>
      </div>

      {/* 予定一覧 */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {schedules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-900">この日は予定がありません</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {schedules.map((s) => {
              const { line1, line2 } = formatTimeBlock(s);
              const company = companyName(s);
              const siteName = s.site?.name ?? "";

              return (
                <li key={s.id}>
                  <Link
                    href={`/schedules/${s.id}`}
                    className="flex w-full items-stretch gap-0 px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100"
                  >
                    {/* 左：時間エリア（固定幅・縦並び） */}
                    <div className="w-[48px] shrink-0 pr-2 text-right">
                      <p className="text-[14px] font-semibold leading-5 text-slate-700">{line1}</p>
                      <p className="text-[14px] font-semibold leading-5 text-slate-500">{line2}</p>
                    </div>

                    {/* 縦区切り線 */}
                    <div className="mx-2 w-px shrink-0 self-stretch bg-slate-200" />

                    {/* 右：元請 + 現場名 */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] leading-5 text-slate-500">
                        {company}
                      </p>
                      {siteName && (
                        <p className="flex items-center gap-1.5 truncate text-[16px] font-semibold leading-6 text-slate-800">
                          <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                          {siteName}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 右下固定FAB */}
      <FloatingAddButton href={`/schedules/new?date=${date}`} />
      
    </div>
  );
}
