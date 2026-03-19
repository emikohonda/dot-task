// apps/web/src/lib/fetchers/employees.ts
import { safeJson } from "@/lib/safeFetch";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export type EmployeeLite = { id: string; name: string };

export async function fetchEmployees(): Promise<EmployeeLite[]> {
  if (!API_BASE_URL) return [];
  const data = await safeJson<{ items: EmployeeLite[] } | EmployeeLite[]>(
    `${API_BASE_URL}/employees`
  );
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}
