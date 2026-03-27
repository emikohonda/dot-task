// apps/web/src/app/calendar/page.tsx
import { Suspense } from "react";
import CalendarClient from "./CalendarClient";
import { between } from "holiday-jp";

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
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

async function fetchMonthSchedules(year: number, month0: number) {
  try {
    const mm = String(month0 + 1).padStart(2, "0");
    const last = new Date(year, month0 + 1, 0).getDate();
    const params = new URLSearchParams({
      dateFrom: `${year}-${mm}-01`,
      dateTo: `${year}-${mm}-${String(last).padStart(2, "0")}`,
      limit: "200",
    });
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

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month0 = now.getMonth();

  const [initialSchedules, holidays] = await Promise.all([
    fetchMonthSchedules(year, month0),
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
        <CalendarClient
          initialSchedules={initialSchedules}
          initialYear={year}
          initialMonth0={month0}
          holidays={holidays}
        />
      </Suspense>
    </div>
  );
}
