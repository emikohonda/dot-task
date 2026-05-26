// apps/web/src/lib/fetchers/schedules.ts
import { getApiAuthHeaders } from "@/lib/apiAuth";
import type { ScheduleApi } from "@/lib/validations/scheduleSchemas";

export type Schedule = ScheduleApi & {
  description?: string | null;

  site?: {
    id: string;
    name: string;
    color?: string | null;
    company?: {
      id: string;
      name: string;
    } | null;
  } | null;

  contractors?: {
    contractor: {
      id: string;
      name: string;
    } | null;
  }[];

  employees?: {
    employee: {
      id: string;
      name: string;
    } | null;
  }[];

  createdAt?: string;
  updatedAt?: string;
};

const API_BASE_URL =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[fetchSchedules] non-ok:", res.status, res.statusText, url, text);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error("[fetchSchedules] failed:", url, error);
    return null;
  }
}

export async function fetchSchedules(limit = 100): Promise<Schedule[]> {
  if (!API_BASE_URL) return [];

  const data = await fetchJson<{ items: Schedule[] } | Schedule[]>(
    `${API_BASE_URL}/schedules?limit=${limit}`,
  );

  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;

  return [];
}

export async function fetchScheduleById(id: string): Promise<Schedule | null> {
  if (!API_BASE_URL) return null;

  const data = await fetchJson<Schedule>(`${API_BASE_URL}/schedules/${id}`);

  return data ?? null;
}