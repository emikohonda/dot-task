// apps/web/src/lib/api.ts

export type Site = {
  id: string;
  name: string;
  address: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  companyId: string | null;
  companyName: string | null;
};

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://127.0.0.1:3001';

console.log('API_BASE_URL =', API_BASE_URL);

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(`${API_BASE_URL}/sites`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sites: ${res.status} ${res.statusText}`);
  }

  return res.json();
}