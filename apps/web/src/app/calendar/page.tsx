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
          <div className="p-6 text-center text-sm text-slate-400">
            読み込み中…
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