// apps/web/src/lib/api.ts
import { getApiAuthHeaders } from "@/lib/apiAuth";

// =====================
// Types (API Models)
// =====================

export type Site = {
  id: string;
  name: string;
  color: string | null;
  address: string | null;
  startDate: string | null;
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

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// =====================
// Sites
// =====================

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

  try {
    const res = await fetch(`${API_BASE_URL}/sites?${params.toString()}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { items?: Site[] } | Site[];

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

export type PaginatedSites = {
  items: Site[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchPaginatedSites(
  options?: {
    limit?: number;
    offset?: number;
    tab?: "active" | "done";
    sortDate?: "asc" | "desc";
    keyword?: string;
    companyId?: string;
    monthFrom?: string;
    monthTo?: string;
  }
): Promise<PaginatedSites> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  if (!API_BASE_URL) {
    return { items: [], total: 0, limit, offset };
  }

  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  params.set("tab", options?.tab ?? "active");
  params.set("sortDate", options?.sortDate ?? "asc");

  if (options?.keyword) params.set("keyword", options.keyword);
  if (options?.companyId) params.set("companyId", options.companyId);
  if (options?.monthFrom) params.set("monthFrom", options.monthFrom);
  if (options?.monthTo) params.set("monthTo", options.monthTo);

  try {
    const res = await fetch(`${API_BASE_URL}/sites?${params.toString()}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) {
      return { items: [], total: 0, limit, offset };
    }

    const data = (await res.json()) as
      | { items?: Site[]; total?: number; limit?: number; offset?: number }
      | Site[];

    if (Array.isArray(data)) {
      return { items: data, total: data.length, limit, offset };
    }

    return {
      items: Array.isArray(data.items) ? data.items : [],
      total:
        typeof data.total === "number"
          ? data.total
          : Array.isArray(data.items)
            ? data.items.length
            : 0,
      limit: typeof data.limit === "number" ? data.limit : limit,
      offset: typeof data.offset === "number" ? data.offset : offset,
    };
  } catch {
    return { items: [], total: 0, limit, offset };
  }
}

// =====================
// Companies
// =====================

export async function fetchCompanies(): Promise<Company[]> {
  if (!API_BASE_URL) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/companies`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { items?: Company[] } | Company[];

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}