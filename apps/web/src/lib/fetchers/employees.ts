// apps/web/src/lib/fetchers/employees.ts
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type EmployeeLite = { id: string; name: string };

export async function fetchEmployees(limit = 200): Promise<EmployeeLite[]> {
  if (!API_BASE_URL) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/employees?limit=${limit}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { items?: EmployeeLite[] } | EmployeeLite[];

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}