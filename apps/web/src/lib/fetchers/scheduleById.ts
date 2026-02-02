import type { Schedule } from "@/lib/fetchers/schedules";

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:3001";

export async function fetchScheduleById(id: string): Promise<Schedule> {
  const res = await fetch(`${API_BASE_URL}/schedules/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.status} ${res.statusText}`);
  return res.json();
}