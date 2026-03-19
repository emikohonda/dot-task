// apps/web/src/lib/fetchers/scheduleById.ts
import type { ScheduleApi } from "@/lib/validations/scheduleSchemas";
import { safeJson } from "@/lib/safeFetch";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchScheduleById(id: string): Promise<ScheduleApi | null> {
  if (!API_BASE_URL) return null;
  const data = await safeJson<ScheduleApi>(`${API_BASE_URL}/schedules/${id}`);
  return data ?? null;
}