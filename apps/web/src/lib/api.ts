// apps/web/src/lib/api.ts
import { safeJson } from "@/lib/safeFetch";

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

// ✅ 本番で 127.0.0.1 に逃がさない（＝落ちる原因を潰す）
const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// ✅ 一覧：失敗しても落とさない（常に配列を返す）
export async function fetchSites(): Promise<Site[]> {
  if (!API_BASE_URL) return [];

  const data = await safeJson<Site[]>(`${API_BASE_URL}/sites`);
  return data ?? [];
}