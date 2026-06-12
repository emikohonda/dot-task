// apps/web/src/app/sites/page.tsx
import { Suspense } from "react";
import { fetchPaginatedSites } from "@/lib/api";
import SitesClient from "./SitesClient";

export const dynamic = "force-dynamic";

const PAGE_LIMIT = 20;

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SitesPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = searchParams ? await searchParams : {};

  const tab = firstValue(sp.tab) === "done" ? "done" : "active";
  const sortDate = firstValue(sp.sortDate) === "desc" ? "desc" : "asc";
  const offsetValue = Number(firstValue(sp.offset) ?? "0");
  const offset = Number.isFinite(offsetValue) ? offsetValue : 0;

  const initialData = await fetchPaginatedSites({
    limit: PAGE_LIMIT,
    offset,
    tab,
    sortDate,
    keyword: firstValue(sp.keyword) ?? "",
    companyId: firstValue(sp.companyId) ?? "",
    monthFrom: firstValue(sp.monthFrom) ?? "",
    monthTo: firstValue(sp.monthTo) ?? "",
  });

  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-slate-400">読み込み中…</div>}>
      <SitesClient initialData={initialData} />
    </Suspense>
  );
}