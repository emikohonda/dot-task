// apps/web/src/lib/fetchers/schedules.ts
import type { ScheduleStatus } from "@/lib/scheduleStatus";
import { safeJson } from "@/lib/safeFetch";

export type Schedule = {
  id: string;
  title: string;
  date: string | null;
  status: ScheduleStatus;

  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;

  siteId?: string | null;
  site?: { id: string; name: string } | null;

  contractors?: { contractor: { id: string; name: string } | null }[];
  employees?: { employee: { id: string; name: string } | null }[];

  createdAt?: string;
  updatedAt?: string;
};

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchSchedules(limit = 100): Promise<Schedule[]> {
  if (!API_BASE_URL) return [];
  const data = await safeJson<{ items: Schedule[] } | Schedule[]>(
    `${API_BASE_URL}/schedules?limit=${limit}`
  );
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export async function fetchScheduleById(id: string): Promise<Schedule | null> {
  if (!API_BASE_URL) return null;
  const data = await safeJson<Schedule>(`${API_BASE_URL}/schedules/${id}`);
  return data ?? null;
}
