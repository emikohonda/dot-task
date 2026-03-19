// apps/web/src/lib/fetchers/siteById.ts
import { safeJson } from "@/lib/safeFetch";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type SiteCompanyContactJoin = {
  companyContact: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

export type SiteDetail = {
  id: string;
  name: string;
  address: string | null;
  companyId: string | null;
  startDate: string | null;
  endDate: string | null;

  company?: { id: string; name: string } | null;

  // ✅ ここが担当者（中間テーブル）
  companyContacts?: SiteCompanyContactJoin[] | null;

  // ついでに返ってくるなら
  contractors?: { contractor: { id: string; name: string } | null }[] | null;
  schedules?: { id: string; title: string; date: string; status: string }[] | null;
};

export async function fetchSiteById(id: string): Promise<SiteDetail | null> {
  if (!API_BASE_URL) return null;
  const data = await safeJson<SiteDetail>(`${API_BASE_URL}/sites/${id}`);
  return data ?? null;
}