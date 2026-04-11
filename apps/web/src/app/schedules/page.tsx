import { Suspense } from "react";
import SchedulesClient from "./SchedulesClient";

const PAGE_LIMIT = 20;

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "";

function todayYmd() {
  return new Date().toLocaleDateString("sv-SE");
}

function yesterdayYmd() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("sv-SE");
}

async function fetchInitialSchedules(sp: { [key: string]: string | string[] | undefined }) {
  if (!API_BASE) return { items: [], total: 0 };

  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : (v ?? "");
  };

  const tab = get("tab") === "done" ? "done" : "active";
  const sortDate = get("sortDate") === "desc" ? "desc" : "asc";
  const keyword = get("keyword");
  const dateTo = get("dateTo");
  const dateFrom = get("dateFrom");
  const siteId = get("siteId");
  const offset = get("offset") || "0";

  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (siteId) params.set("siteId", siteId);

  if (tab === "active") {
    const effectiveDateFrom = dateFrom && dateFrom > todayYmd() ? dateFrom : todayYmd();
    params.set("dateFrom", effectiveDateFrom);
  } else {
    const effectiveDateTo = dateTo && dateTo < yesterdayYmd() ? dateTo : yesterdayYmd();
    params.set("dateTo", effectiveDateTo);
  }

  params.set("limit", String(PAGE_LIMIT));
  params.set("offset", offset);
  params.set("sortDate", sortDate);

  try {
    const res = await fetch(`${API_BASE}/schedules?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return { items: [], total: 0 };

    const data = await res.json();

    if (data && Array.isArray(data.items)) {
      return { items: data.items, total: data.total ?? data.items.length };
    }

    if (Array.isArray(data)) {
      return { items: data, total: data.length };
    }

    return { items: [], total: 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export const dynamic = "force-dynamic";

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const initialData = await fetchInitialSchedules(resolved);

  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-slate-400">読み込み中…</div>}>
      <SchedulesClient
        initialSchedules={initialData.items}
        initialTotal={initialData.total}
      />
    </Suspense>
  );
}