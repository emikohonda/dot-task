// apps/web/src/lib/fetchers/companyContacts.ts
import { safeJson } from "@/lib/safeFetch";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type CompanyContactLite = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  companyId: string;
};

export async function fetchCompanyContacts(limit = 200): Promise<CompanyContactLite[]> {
  if (!API_BASE_URL) return [];
  const data = await safeJson<{ items: CompanyContactLite[] } | CompanyContactLite[]>(
    `${API_BASE_URL}/company-contacts?limit=${limit}`
  );
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}
