// apps/web/src/lib/fetchers/contractors.ts
import { getApiAuthHeaders } from "@/lib/apiAuth";
import type { ContractorLite } from "@/lib/api";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchContractors(limit = 200): Promise<ContractorLite[]> {
  if (!API_BASE_URL) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/contractors?limit=${limit}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { items?: ContractorLite[] } | ContractorLite[];

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}