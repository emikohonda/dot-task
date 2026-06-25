// apps/web/src/lib/fetchers/sites.ts
import type { Site } from "@/lib/api";
import type { SiteDetail } from "@/types/site";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchSites(limit = 200): Promise<Site[]> {
  if (!API_BASE_URL) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/sites?limit=${limit}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { items?: Site[] } | Site[];

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

export async function fetchSite(siteId: string): Promise<SiteDetail | null> {
  if (!API_BASE_URL) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) return null;

    return (await res.json()) as SiteDetail;
  } catch {
    return null;
  }
}

export type SiteSchedule = {
  id: string;
  title: string;
  date: string;
  endDate?: string | null;
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

  try {
    const res = await fetch(
      `${API_BASE_URL}/sites/${siteId}/schedules?${query.toString()}`,
      {
        cache: "no-store",
        headers: await getApiAuthHeaders(),
      }
    );

    if (!res.ok) return { items: [], total: 0 };

    return (await res.json()) as SiteScheduleResult;
  } catch {
    return { items: [], total: 0 };
  }
}