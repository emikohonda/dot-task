// apps/web/src/app/calendar/_components/calendar.ts
import type { Schedule } from "@/lib/fetchers/schedules";

/** Date → "YYYY-MM-DD"（ローカル時刻基準） */
export function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "YYYY-MM-DD" → Date */
export function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 月の最初の日 */
export function startOfMonth(year: number, month0: number): Date {
  return new Date(year, month0, 1);
}

/** 月の日数 */
export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** "2026年3月" 形式 */
export function formatMonthTitle(year: number, month0: number): string {
  return `${year}年${month0 + 1}月`;
}

/** 月の最初日・最終日を "YYYY-MM-DD" で返す */
export function monthRange(year: number, month0: number): { from: string; to: string } {
  const total = daysInMonth(year, month0);
  const mm = String(month0 + 1).padStart(2, "0");
  const last = String(total).padStart(2, "0");
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${last}`,
  };
}

/** delta月ずらした { year, month0 } を返す */
export function addMonths(year: number, month0: number, delta: number): { year: number; month0: number } {
  const d = new Date(year, month0 + delta, 1);
  return { year: d.getFullYear(), month0: d.getMonth() };
}

/** 月グリッドのセル配列を返す（空セルは null） */
export function buildCalendarCells(year: number, month0: number): Array<Date | null> {
  const first = startOfMonth(year, month0);
  const firstDow = first.getDay(); // 0=日
  const total = daysInMonth(year, month0);

  const cells: Array<Date | null> = [];

  // 月初前の空セル
  for (let i = 0; i < firstDow; i++) cells.push(null);

  // 日付セル
  for (let d = 1; d <= total; d++) {
    cells.push(new Date(year, month0, d));
  }

  return cells;
}

/** Schedule[] を "YYYY-MM-DD" → Schedule[] の Map に変換 */
export function groupByDate(schedules: Schedule[]): Map<string, Schedule[]> {
  const map = new Map<string, Schedule[]>();
  for (const s of schedules) {
    if (!s.date) continue;
    const key = ymdLocal(new Date(s.date));
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return map;
}
