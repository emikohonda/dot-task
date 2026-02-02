const API_BASE_URL =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://127.0.0.1:3001';

export type Site = {
    id: string;
    name: string;
};

export async function fetchSites (limit = 200): Promise<Site[]> {
    const res = await fetch(`${API_BASE_URL}/sites?limit=${limit}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch sites: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

export type SiteSchedule = {
    id: string;
    title: string;
    date: string;
    status: string | null;
    contractor: { name: string } | null;
};

export async function fetchSiteSchedules(siteId: string, limit = 3): Promise<SiteSchedule[]> {
    const res = await fetch(`${API_BASE_URL}/sites/${siteId}/schedules?limit=${limit}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch site schedules: ${res.status} ${res.statusText}`);
    }

    return res.json();
}
    