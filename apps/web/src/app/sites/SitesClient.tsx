// apps/web/src/app/sites/SitesClient.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";
import { Combobox } from "@/components/Combobox";
import { KeywordSearchBox } from "@/components/KeywordSearchBox";
import { SearchActionRow } from "@/components/SearchActionRow";
import type { ComboboxOption } from "@/components/Combobox";
import { Building2, Calendar, Plus } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

const PAGE_LIMIT = 20;

type Site = {
  id: string;
  name: string;
  companyName?: string | null;
  address?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
};

type PaginatedSites = {
  items: Site[];
  total: number;
  limit: number;
  offset: number;
};

type SiteProgressStatus = "upcoming" | "active" | "completed" | null;

function toDateOnly(value: string): Date {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getSiteProgressStatus(
  startDate?: string | null,
  endDate?: string | null
): SiteProgressStatus {
  if (!startDate && !endDate) return null;

  const today = new Date();
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = startDate ? toDateOnly(startDate) : null;
  const end = endDate ? toDateOnly(endDate) : null;

  if (start && start > now) return "upcoming";
  if (end && end < now) return "completed";
  return "active";
}

const SITE_STATUS_META: Record<
  NonNullable<SiteProgressStatus>,
  { label: string; className: string }
> = {
  upcoming: { label: "未着工", className: "bg-slate-100 text-slate-600" },
  active: { label: "進行中", className: "bg-sky-100 text-sky-700" },
  completed: { label: "完了", className: "bg-emerald-100 text-emerald-700" },
};

async function fetchSites(params: URLSearchParams): Promise<PaginatedSites> {
  try {
    const res = await fetch(`${API_BASE}/sites?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
    }

    const data = await res.json();

    if (data && Array.isArray(data.items)) {
      return data as PaginatedSites;
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

async function fetchOptions(path: string): Promise<ComboboxOption[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return [];

    const data = await res.json();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : [];

    return list.map((x: { id: string; name: string }) => ({
      id: x.id,
      name: x.name,
    }));
  } catch {
    return [];
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatPeriod(start?: string | null, end?: string | null) {
  const s = formatDate(start);
  const e = formatDate(end);

  if (s === "-" && e === "-") return "-";
  return `${s} ～ ${e}`;
}

export default function SitesClient({ initialSites }: { initialSites: Site[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = React.useState(searchParams.get("keyword") ?? "");
  const [companyId, setCompanyId] = React.useState<string | null>(
    searchParams.get("companyId")
  );
  const [status, setStatus] = React.useState(searchParams.get("status") ?? "");
  const [offset, setOffset] = React.useState(Number(searchParams.get("offset") ?? 0));

  const [total, setTotal] = React.useState(initialSites.length);
  const [companyOptions, setCompanyOptions] = React.useState<ComboboxOption[]>([]);
  const [sites, setSites] = React.useState<Site[]>(initialSites);
  const [loading, setLoading] = React.useState(false);

  const isFirstRender = React.useRef(true);

  const hasFilter = !!(keyword || companyId || status);
  const [filterOpen, setFilterOpen] = React.useState(hasFilter);

  React.useEffect(() => {
    fetchOptions("/companies?limit=200").then(setCompanyOptions);
  }, []);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    const nextOffset = Number(searchParams.get("offset") ?? "0");

    params.set("limit", String(PAGE_LIMIT));
    params.set("offset", String(Number.isFinite(nextOffset) ? nextOffset : 0));

    setLoading(true);

    fetchSites(params)
      .then((data) => {
        setSites(data.items);
        setTotal(data.total);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  React.useEffect(() => {
    const nextKeyword = searchParams.get("keyword") ?? "";
    const nextCompanyId = searchParams.get("companyId");
    const nextStatus = searchParams.get("status") ?? "";

    setKeyword(nextKeyword);
    setCompanyId(nextCompanyId);
    setStatus(nextStatus);

    const nextOffset = Number(searchParams.get("offset") ?? "0");
    setOffset(Number.isFinite(nextOffset) ? nextOffset : 0);
  }, [searchParams]);

  const applyFilter = React.useCallback(() => {
    const params = new URLSearchParams();

    if (keyword) params.set("keyword", keyword);
    if (companyId) params.set("companyId", companyId);
    if (status) params.set("status", status);

    params.set("offset", "0");
    router.replace(`/sites?${params.toString()}`, { scroll: false });
  }, [keyword, companyId, status, router]);

  const resetFilter = () => {
    setKeyword("");
    setCompanyId(null);
    setStatus("");
    router.replace("/sites", { scroll: false });
  };

  const goToOffset = (nextOffset: number) => {
    const params = new URLSearchParams();

    if (keyword) params.set("keyword", keyword);
    if (companyId) params.set("companyId", companyId);
    if (status) params.set("status", status);

    params.set("offset", String(nextOffset));
    router.replace(`/sites?${params.toString()}`, { scroll: false });
  };

  const isDirty =
    keyword !== (searchParams.get("keyword") ?? "") ||
    status !== (searchParams.get("status") ?? "") ||
    (companyId ?? "") !== (searchParams.get("companyId") ?? "");

  const hasAny = sites.length > 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_LIMIT < total;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + PAGE_LIMIT, total);

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-2xl font-bold leading-none text-slate-900">
        現場一覧
      </h1>
      {/* アコーディオン式フィルターパネル */}
      <div
        className={[
          "rounded-2xl border border-slate-100 bg-white shadow-sm transition-all",
          filterOpen ? "overflow-visible" : "overflow-hidden",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
          aria-controls="site-filter-panel"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <span className="flex items-center gap-2">
            {hasFilter ? (
              <>
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span className="font-semibold text-sky-600">絞り込み中</span>
              </>
            ) : (
              <span>絞り込み検索</span>
            )}
          </span>

          <span className="text-xs font-medium text-slate-500">
            {filterOpen ? "閉じる" : "開く"}
          </span>
        </button>

        <div
          id="site-filter-panel"
          className={[
            "transition-all duration-300 ease-in-out",
            filterOpen
              ? "max-h-[600px] opacity-100 overflow-visible"
              : "max-h-0 opacity-0 overflow-hidden",
          ].join(" ")}
        >
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <KeywordSearchBox
                placeholder="現場名"
                value={keyword}
                onChange={setKeyword}
                onSearch={applyFilter}
              />

              <Combobox
                label="元請会社"
                options={companyOptions}
                value={companyId}
                onChange={setCompanyId}
                placeholder="元請会社で絞り込む"
              />

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">進行状態</p>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">すべて</option>
                  <option value="upcoming">未着工</option>
                  <option value="active">進行中</option>
                  <option value="completed">完了</option>
                </select>
              </div>
            </div>

            <SearchActionRow
              onSearch={applyFilter}
              onReset={resetFilter}
              showReset={hasFilter}
              loading={loading}
              isDirty={isDirty}
              hasFilter={hasFilter}
              count={total}
            />
          </div>
        </div>
      </div>

      <CardSection>
        {!hasAny ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              {hasFilter ? "条件に一致する現場はありません" : "まだ現場が登録されていません"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {hasFilter
                ? "絞り込み条件を変えてみてください。"
                : "右上の「＋ 現場を追加」から登録できます。"}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {sites.map((site) => {
                const progressStatus = getSiteProgressStatus(
                  site.startDate,
                  site.endDate
                );
                const statusMeta = progressStatus
                  ? SITE_STATUS_META[progressStatus]
                  : null;

                return (
                  <li key={site.id} className="py-4">
                    <Link
                      href={`/sites/${site.id}`}
                      className="group flex items-start gap-3 rounded-xl transition-colors hover:bg-slate-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[18px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-sky-600">
                          {site.name}
                        </p>

                        <div className="mt-1 space-y-0.5">
                          <p className="flex items-center gap-1.5 text-[14px] leading-6 text-slate-600">
                            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                            {site.companyName ?? "-"}
                          </p>
                          <p className="flex items-center gap-1.5 text-[14px] leading-6 text-slate-600">
                            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                            {formatPeriod(site.startDate, site.endDate)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {statusMeta ? (
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {total > PAGE_LIMIT && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  {rangeStart}〜{rangeEnd} / 全{total}件
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToOffset(offset - PAGE_LIMIT)}
                    disabled={!hasPrev || loading}
                    className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← 前へ
                  </button>

                  <button
                    type="button"
                    onClick={() => goToOffset(offset + PAGE_LIMIT)}
                    disabled={!hasNext || loading}
                    className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    次へ →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardSection>

      {/* スマホ用FAB */}
      <Link
        href="/sites/new"
        className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
        aria-label="現場を追加"
      >
        <Plus className="h-5 w-5" />
        <span>現場を追加</span>
      </Link>
    </div>
  );
}