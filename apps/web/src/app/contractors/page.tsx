// apps/web/src/app/contractors/page.tsx
import { Suspense } from "react";
import { ContractorsClient } from "./ContractorsClient";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

const PAGE_LIMIT = 20;

type Contact = { name: string; phone?: string; email?: string };

type Contractor = {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  contacts?: Contact[];
  createdAt: string;
  updatedAt: string;
};

type PaginatedContractors = {
  items: Contractor[];
  total: number;
  limit: number;
  offset: number;
};

type SearchParams = {
  keyword?: string | string[];
  offset?: string | string[];
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

async function fetchContractorsOnServer(
  params: URLSearchParams
): Promise<PaginatedContractors> {
  try {
    const res = await fetch(`${API_BASE}/contractors?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
    }

    const data = await res.json();

    if (data && Array.isArray(data.items)) {
      return data as PaginatedContractors;
    }

    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        limit: PAGE_LIMIT,
        offset: 0,
      };
    }

    return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
  } catch {
    return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
  }
}

function getSingle(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContractorsPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : {};

  const keyword = getSingle(resolved.keyword) ?? "";
  const offset = getSingle(resolved.offset) ?? "0";

  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  params.set("offset", offset);
  params.set("limit", String(PAGE_LIMIT));

  const initialData = await fetchContractorsOnServer(params);

  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-slate-400">読み込み中…</div>}>
      <ContractorsClient initialData={initialData} />
    </Suspense>
  );
}