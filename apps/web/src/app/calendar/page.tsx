import { Suspense } from "react";
import CalendarClient from "./CalendarClient";
import { fetchSchedules } from "@/lib/fetchers/schedules";
import { fetchSites } from "@/lib/fetchers/sites";
import { between } from "holiday-jp";

function toYmdTokyo(d: Date) {
  // 祝日は「日付」が本体なので、タイムゾーンずれを防ぐため Asia/Tokyo 固定で YYYY-MM-DD にする
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }); // "2026-01-23"
}

function buildHolidaysForYears(years: number[]) {
  const map: Record<string, string> = {};

  for (const y of years) {
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);

    const list = between(start, end); // [{ date: Date, name: string }, ...]
    for (const h of list) {
      map[toYmdTokyo(h.date)] = h.name;
    }
  }

  return map;
}

export default async function CalendarPage() {
  const [initialSchedules, sites] = await Promise.all([
    fetchSchedules(200),
    fetchSites(200),
  ]);

  // 年跨ぎの月移動に備えて、今年±1年ぶん持っておくのが楽
  const now = new Date();
  const thisYear = now.getFullYear();
  const holidays = buildHolidaysForYears([thisYear - 1, thisYear, thisYear + 1]);

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          読み込み中…
        </div>
      }
    >
      <CalendarClient
        initialSchedules={initialSchedules}
        sites={sites.map((s) => ({ id: s.id, name: s.name }))}
        holidays={holidays}
      />
    </Suspense>
  );
}