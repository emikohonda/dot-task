// apps/web/src/lib/calendarCache.ts
const MONTH_DATA_STORAGE_PREFIX = "calendar:monthSchedules:";

export function clearCalendarScheduleCache() {
  if (typeof window === "undefined") return;

  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(MONTH_DATA_STORAGE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
}