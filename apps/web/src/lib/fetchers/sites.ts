const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type Site = {
  id: string;
  name: string;
};

// 一覧は必ず配列を返す
export async function fetchSites(limit = 200): Promise<Site[]> {
  if (!API_BASE_URL) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/sites?limit=${limit}`, {
      cache: "no-store",
    });

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export type SiteSchedule = {
  id: string;
  title: string;
  date: string;
  status: string | null;
  contractor: { name: string } | null;
};

// 現場スケジュールも同様
export async function fetchSiteSchedules(
  siteId: string,
  limit = 3
): Promise<SiteSchedule[]> {
  if (!API_BASE_URL) return [];

  try {
    const res = await fetch(
      `${API_BASE_URL}/sites/${siteId}/schedules?limit=${limit}`,
      { cache: "no-store" }
    );

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}