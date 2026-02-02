import type { ScheduleStatus } from "@/lib/scheduleStatus";

export type Schedule = {
  id: string;
  title: string;
  date: string | null;
  status: ScheduleStatus;
  contractor?: { id: string; name: string } | null;
  site?: { id: string; name: string } | null;
};

// ❌ localhost フォールバック削除
const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchSchedules(limit = 100): Promise<Schedule[]> {
  if (!API_BASE_URL) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/schedules?limit=${limit}`, {
      cache: "no-store",
    });

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}