// apps/web/src/lib/fetchers/contractors.ts
import { safeJson } from "@/lib/safeFetch";
import type { ContractorLite } from "@/lib/api";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchContractors(limit = 200): Promise<ContractorLite[]> {
  if (!API_BASE_URL) return [];
  const data = await safeJson<{ items: ContractorLite[] } | ContractorLite[]>(
    `${API_BASE_URL}/contractors?limit=${limit}`
  );
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}
