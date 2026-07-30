// apps/web/src/app/calendar/page.tsx
import { gridRange } from "./_components/calendar";
import { Suspense } from "react";
import { CalendarClientNoSsr } from "./CalendarClientNoSsr";
import { between } from "holiday-jp";
import { getApiAuthHeaders } from "@/lib/apiAuth";

function toYmdTokyo(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

function buildHolidays(years: number[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const y of years) {
    const list = between(new Date(y, 0, 1), new Date(y, 11, 31));
    for (const h of list) {
      map[toYmdTokyo(h.date)] = h.name;
    }
  }
  return map;
}

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

async function fetchInitialSchedules(year: number, month0: number) {
  try {
    const { from, to } = gridRange(year, month0);
    const params = new URLSearchParams({
      dateFrom: from,
      dateTo: to,
      limit: "200",
    });
    const res = await fetch(`${API_BASE}/schedules?${params.toString()}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
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

// YYYY-MM-DD 形式かつ実在する日付のみ受け付ける
function parseYmd(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Date.UTC でタイムゾーン非依存のまま実在チェック
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { ymd: value, year, month0: month - 1 };
}

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const now = new Date();
  const parsed = parseYmd(date);

  const year = parsed?.year ?? now.getFullYear();
  const month0 = parsed?.month0 ?? now.getMonth();
  const initialSelectedDate = parsed?.ymd; // 検証済みの値のみ渡す

  const [initialSchedules, holidays] = await Promise.all([
    fetchInitialSchedules(year, month0),
    Promise.resolve(buildHolidays([year - 1, year, year + 1])),
  ]);

  return (
    <div className="-mx-4 -mt-5 -mb-24 md:-mx-6 md:-mt-6 md:-mb-8">
      <Suspense
        fallback={
          <div className="relative flex h-[calc(100dvh-112px)] flex-col overflow-hidden bg-white">
            <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-1">
              <div className="h-8 w-28 rounded bg-slate-100" />
              <div className="flex items-center gap-1">
                <div className="h-9 w-9 rounded-full bg-slate-100" />
                <div className="h-8 w-14 rounded-full bg-slate-100" />
                <div className="h-9 w-9 rounded-full bg-slate-100" />
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-7 border-b border-slate-100">
              {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
                <div
                  key={w}
                  className="py-1 text-center text-[11px] font-semibold text-slate-300"
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid min-h-0 flex-[6] grid-cols-7 grid-rows-6 gap-px bg-slate-100">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="bg-white p-0.5">
                  <div className="mx-auto h-3 w-4 rounded bg-slate-100" />
                </div>
              ))}
            </div>

            <div className="flex min-h-0 flex-[4] flex-col border-t border-slate-200 bg-white">
              <div className="flex shrink-0 items-center justify-between px-4 py-2">
                <div className="h-5 w-28 rounded bg-slate-100" />
                <div className="h-7 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="py-6" aria-hidden="true" />
            </div>
          </div>
        }
      >
        <CalendarClientNoSsr
          initialSchedules={initialSchedules}
          initialYear={year}
          initialMonth0={month0}
          holidays={holidays}
          initialSelectedDate={initialSelectedDate}
        />
      </Suspense>
    </div>
  );
}
