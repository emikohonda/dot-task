// apps/web/src/app/calendar/_components/calendar.ts
import type { Schedule } from "@/lib/fetchers/schedules";

export function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfMonth(year: number, month0: number): Date {
  return new Date(year, month0, 1);
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function formatMonthTitle(year: number, month0: number): string {
  return `${year}年${month0 + 1}月`;
}

export function monthRange(year: number, month0: number): { from: string; to: string } {
  const total = daysInMonth(year, month0);
  const mm = String(month0 + 1).padStart(2, "0");
  const last = String(total).padStart(2, "0");
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${last}`,
  };
}

export function addMonths(
  year: number,
  month0: number,
  delta: number,
): { year: number; month0: number } {
  const d = new Date(year, month0 + delta, 1);
  return { year: d.getFullYear(), month0: d.getMonth() };
}

export function buildCalendarCells(year: number, month0: number): Date[] {
  const first = new Date(year, month0, 1);
  const firstDow = first.getDay();
  const cells: Date[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push(new Date(year, month0, -i));
  }

  const total = daysInMonth(year, month0);
  for (let d = 1; d <= total; d++) {
    cells.push(new Date(year, month0, d));
  }

  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push(new Date(year, month0 + 1, d));
  }

  return cells;
}

export function gridRange(year: number, month0: number): { from: string; to: string } {
  const cells = buildCalendarCells(year, month0);
  return {
    from: ymdLocal(cells[0]),
    to: ymdLocal(cells[cells.length - 1]),
  };
}

/**
 * Schedule[] を "YYYY-MM-DD" → Schedule[] の Map に変換
 * 期間予定（endDate あり）は date〜endDate の各日に展開する
 */
export function groupByDate(schedules: Schedule[]): Map<string, Schedule[]> {
  const map = new Map<string, Schedule[]>();
  const MAX_DAYS = 366; // 無限ループ防止

  for (const s of schedules) {
    if (!s.date) continue;

    const startYmd = s.date.slice(0, 10);
    const endYmd = s.endDate ? s.endDate.slice(0, 10) : startYmd;

    const startDate = ymdToDate(startYmd);
    const endDate = ymdToDate(endYmd);

    const current = new Date(startDate);
    let dayCount = 0;

    while (current <= endDate && dayCount < MAX_DAYS) {
      const key = ymdLocal(current);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
      current.setDate(current.getDate() + 1);
      dayCount++;
    }
  }

  return map;
}