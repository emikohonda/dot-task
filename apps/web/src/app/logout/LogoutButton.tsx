// apps/web/src/app/logout/LogoutButton.tsx
"use client";

import { clearCalendarScheduleCache } from "@/lib/calendarCache";

export function LogoutButton() {
  return (
    <button
      type="submit"
      onClick={() => {
        clearCalendarScheduleCache();
      }}
      className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
    >
      ログアウトする
    </button>
  );
}