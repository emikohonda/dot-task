// apps/web/src/lib/api.ts
import { safeJson } from "@/lib/safeFetch";

// =====================
// Types (API Models)
// =====================

export type Site = {
  id: string;
  name: string;
  address: string | null;
  startDate: string | null; // ISO string (e.g. "2026-02-23T00:00:00.000Z")
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  companyId: string | null;
  companyName: string | null;
};

export type CompanyContact = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

export type Company = {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contacts?: CompanyContact[];
};

export type ContractorContact = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

export type Contractor = {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contacts?: ContractorContact[];
};

export type ContractorLite = {
  id: string;
  name: string;
};

export type EmployeeLite = {
  id: string;
  name: string;
};

// ✅ 本番で 127.0.0.1 に逃がさない（＝落ちる原因を潰す）
const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// =====================
// Sites
// =====================

// ✅ 一覧：失敗しても落とさない（常に配列を返す）
export async function fetchSites(
  limit = 200,
  options?: {
    tab?: "active" | "done";
    sortDate?: "asc" | "desc";
  }
): Promise<Site[]> {
  if (!API_BASE_URL) return [];

  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("tab", options?.tab ?? "active");
  params.set("sortDate", options?.sortDate ?? "asc");

  const data = await safeJson<{ items: Site[] } | Site[]>(
    `${API_BASE_URL}/sites?${params.toString()}`
  );

  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

// =====================
// Companies (optional - 使いたくなったら)
// =====================

// 今は page.tsx 側で fetch してるけど、
// 後で「API呼び出しも集約したい」になったらここに増やせる。
export async function fetchCompanies(): Promise<Company[]> {
  if (!API_BASE_URL) return [];
  const data = await safeJson<{ items: Company[] } | Company[]>(`${API_BASE_URL}/companies`);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}