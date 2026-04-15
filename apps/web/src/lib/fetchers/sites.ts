// apps/web/src/lib/fetchers/sites.ts
import type { Site } from "@/lib/api";
import type { SiteDetail } from "@/types/site";
import { safeJson } from "@/lib/safeFetch";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// 一覧は必ず配列を返す（pagination形式・配列の両方に対応）
export async function fetchSites(limit = 200): Promise<Site[]> {
  if (!API_BASE_URL) return [];
  const data = await safeJson<{ items: Site[] } | Site[]>(`${API_BASE_URL}/sites?limit=${limit}`);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export async function fetchSite(siteId: string): Promise<SiteDetail | null> {
  if (!API_BASE_URL) return null;
  const data = await safeJson<SiteDetail>(`${API_BASE_URL}/sites/${siteId}`);
  return data ?? null;
}

export type SiteSchedule = {
  id: string;
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;

  contractors?: { contractor: { id: string; name: string } | null }[];
  employees?: { employee: { id: string; name: string } | null }[];
};

export type SiteScheduleResult = {
  items: SiteSchedule[];
  total: number;
};

export async function fetchSiteSchedules(
  siteId: string,
  limit = 3,
  options?: { includeCompleted?: boolean }
): Promise<SiteScheduleResult> {
  if (!API_BASE_URL) return { items: [], total: 0 };
  const query = new URLSearchParams({ limit: String(limit) });
  if (options?.includeCompleted) query.set("includeCompleted", "true");
  const data = await safeJson<SiteScheduleResult>(
    `${API_BASE_URL}/sites/${siteId}/schedules?${query.toString()}`
  );
  return data ?? { items: [], total: 0 };
}