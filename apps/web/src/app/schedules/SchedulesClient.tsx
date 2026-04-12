// apps/web/src/app/schedules/SchedulesClient.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardSection } from "@/components/CardSection";
import { Combobox } from "@/components/Combobox";
import { KeywordSearchBox } from "@/components/KeywordSearchBox";
import { SearchActionRow } from "@/components/SearchActionRow";
import { Calendar, Clock, MapPin, ArrowUpDown, Plus, Sun } from "lucide-react";
import { ScheduleTime } from "@/app/schedules/_components/ScheduleTime";
import type { Schedule } from "@/lib/fetchers/schedules";
import type { ComboboxOption } from "@/components/Combobox";
import { formatScheduleTitle } from "@/lib/validations/scheduleSchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

const PAGE_LIMIT = 20;

type PaginatedSchedules = {
  items: Schedule[];
  total: number;
  limit: number;
  offset: number;
};

type TabType = "active" | "done";
type SortType = "asc" | "desc";

async function fetchSchedules(params: URLSearchParams): Promise<PaginatedSchedules> {
  try {
    const res = await fetch(`${API_BASE}/schedules?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
    const data = await res.json();
    if (data && Array.isArray(data.items)) return data as PaginatedSchedules;
    if (Array.isArray(data)) return { items: data, total: data.length, limit: PAGE_LIMIT, offset: 0 };
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
    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return list.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }));
  } catch {
    return [];
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${y}/${m}/${d}`;
}

function getTodayYmd() {
  return new Date().toLocaleDateString("sv-SE");
}

function getYesterdayYmd() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("sv-SE");
}

export default function SchedulesClient({
  initialSchedules,
  initialTotal,
}: {
  initialSchedules: Schedule[];
  initialTotal: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = React.useState(searchParams.get("keyword") ?? "");
  const [dateFrom, setDateFrom] = React.useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = React.useState(searchParams.get("dateTo") ?? "");
  const [siteId, setSiteId] = React.useState<string | null>(searchParams.get("siteId"));
  const [offset, setOffset] = React.useState(Number(searchParams.get("offset") ?? 0));

  const [siteOptions, setSiteOptions] = React.useState<ComboboxOption[]>([]);
  const [schedules, setSchedules] = React.useState<Schedule[]>(initialSchedules);
  const [total, setTotal] = React.useState(initialTotal);
  const [loading, setLoading] = React.useState(false);

  const activeTab: TabType = searchParams.get("tab") === "done" ? "done" : "active";
  const sortDate: SortType = searchParams.get("sortDate") === "desc" ? "desc" : "asc";

  // ── Fix: effectiveDateFrom/To を削除し、dateFrom/dateTo を直接使う ──
  const hasFilter = !!(keyword || dateFrom || dateTo || siteId);
  const [filterOpen, setFilterOpen] = React.useState(hasFilter);

  React.useEffect(() => {
    fetchOptions("/sites?limit=200").then(setSiteOptions);
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const nextOffset = Number(searchParams.get("offset") ?? "0");
    const currentDateFrom = searchParams.get("dateFrom") ?? "";
    const currentDateTo = searchParams.get("dateTo") ?? "";

    params.set("limit", String(PAGE_LIMIT));
    params.set("offset", String(Number.isFinite(nextOffset) ? nextOffset : 0));
    params.set("sortDate", sortDate);

    const todayYmd = getTodayYmd();
    const yesterdayYmd = getYesterdayYmd();

    if (activeTab === "active") {
      const effectiveDateFrom =
        currentDateFrom && currentDateFrom > todayYmd ? currentDateFrom : todayYmd;
      params.set("dateFrom", effectiveDateFrom);

      if (currentDateTo) {
        params.set("dateTo", currentDateTo);
      } else {
        params.delete("dateTo");
      }
    } else {
      const effectiveDateTo =
        currentDateTo && currentDateTo < yesterdayYmd ? currentDateTo : yesterdayYmd;
      params.set("dateTo", effectiveDateTo);

      if (currentDateFrom) {
        params.set("dateFrom", currentDateFrom);
      } else {
        params.delete("dateFrom");
      }
    }

    setLoading(true);
    fetchSchedules(params)
      .then((data) => {
        setSchedules(data.items);
        setTotal(data.total);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, sortDate, activeTab]);

  React.useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    setDateFrom(searchParams.get("dateFrom") ?? "");
    setDateTo(searchParams.get("dateTo") ?? "");
    setSiteId(searchParams.get("siteId"));
    const nextOffset = Number(searchParams.get("offset") ?? "0");
    setOffset(Number.isFinite(nextOffset) ? nextOffset : 0);
  }, [searchParams]);

  // ── Fix: dateFrom/dateTo 両方セット ──
  const buildFilterParams = React.useCallback(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (siteId) params.set("siteId", siteId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params;
  }, [keyword, dateFrom, dateTo, siteId]);

  const applyFilter = React.useCallback(() => {
    const params = buildFilterParams();
    params.set("tab", activeTab);
    params.set("sortDate", sortDate);
    params.set("offset", "0");

    const todayYmd = getTodayYmd();
    const yesterdayYmd = getYesterdayYmd();

    if (activeTab === "active") {
      const currentFrom = params.get("dateFrom") ?? "";
      const nextFrom = !currentFrom || currentFrom < todayYmd ? todayYmd : currentFrom;
      params.set("dateFrom", nextFrom);
      if (nextFrom !== dateFrom) setDateFrom(nextFrom);
    }

    if (activeTab === "done") {
      const currentTo = params.get("dateTo") ?? "";
      const nextTo = !currentTo || currentTo > yesterdayYmd ? yesterdayYmd : currentTo;
      params.set("dateTo", nextTo);
      if (nextTo !== dateTo) setDateTo(nextTo);
    }

    router.replace(`/schedules?${params.toString()}`, { scroll: false });
  }, [buildFilterParams, activeTab, sortDate, router, dateFrom, dateTo]);

  const resetFilter = () => {
    setKeyword("");
    setDateFrom("");
    setDateTo("");
    setSiteId(null);

    const params = new URLSearchParams();
    params.set("tab", "active");
    params.set("sortDate", "asc");
    router.replace(`/schedules?${params.toString()}`, { scroll: false });
  };

  const goToOffset = (nextOffset: number) => {
    const params = buildFilterParams();
    params.set("tab", activeTab);
    params.set("sortDate", sortDate);
    params.set("offset", String(nextOffset));
    router.replace(`/schedules?${params.toString()}`, { scroll: false });
  };

  // ── Fix: タブ切り替え時も dateFrom/dateTo 両方残す ──
  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (siteId) params.set("siteId", siteId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("tab", tab);
    params.set("sortDate", sortDate);
    params.set("offset", "0");
    router.replace(`/schedules?${params.toString()}`, { scroll: false });
  };

  const handleSortToggle = () => {
    const next: SortType = sortDate === "asc" ? "desc" : "asc";
    const params = buildFilterParams();
    params.set("tab", activeTab);
    params.set("sortDate", next);
    params.set("offset", "0");
    router.replace(`/schedules?${params.toString()}`, { scroll: false });
  };

  // ── Fix: effectiveDateFrom/To をやめて dateFrom/dateTo で比較 ──
  const isDirty =
    keyword !== (searchParams.get("keyword") ?? "") ||
    dateFrom !== (searchParams.get("dateFrom") ?? "") ||
    dateTo !== (searchParams.get("dateTo") ?? "") ||
    (siteId ?? "") !== (searchParams.get("siteId") ?? "");

  const hasAny = schedules.length > 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_LIMIT < total;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + PAGE_LIMIT, total);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-bold leading-none text-slate-900">予定一覧</h1>
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/schedules/today"
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
          >
            <Sun className="h-4 w-4" />今日の予定
          </Link>
          <Link
            href="/schedules/new"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            ＋ 予定を追加
          </Link>
        </div>
      </div>

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
          aria-controls="schedule-filter-panel"
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
          id="schedule-filter-panel"
          className={[
            "transition-all duration-300 ease-in-out",
            filterOpen ? "max-h-[700px] opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden",
          ].join(" ")}
        >
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <KeywordSearchBox
                placeholder="タイトル・現場名・メモ"
                value={keyword}
                onChange={setKeyword}
                onSearch={applyFilter}
              />
              <Combobox
                label="現場"
                options={siteOptions}
                value={siteId}
                onChange={setSiteId}
                placeholder="現場で絞り込む"
              />
              <div className="sm:col-span-2 min-w-0 space-y-1">
                <p className="text-sm font-medium text-slate-500">対象期間</p>
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="box-border min-h-[44px] min-w-0 flex-1 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  <span className="shrink-0 text-sm text-slate-400">〜</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="box-border min-h-[44px] min-w-0 flex-1 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>
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

      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => handleTabChange("active")}
            className={[
              "min-h-[44px] rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
              activeTab === "active" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            未完了
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("done")}
            className={[
              "min-h-[44px] rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
              activeTab === "done" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            完了済
          </button>
        </div>

        <button
          type="button"
          onClick={handleSortToggle}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortDate === "asc" ? "近い順" : "遠い順"}
        </button>
      </div>

      <CardSection>
        {!hasAny ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              {hasFilter ? "条件に一致する予定はありません" : "予定はまだありません"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {hasFilter ? "絞り込み条件を変えてみてください。" : "「予定を追加」から登録できます。"}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {schedules.map((s) => (
                <li key={s.id} className="py-4">
                  <Link
                    href={`/schedules/${s.id}`}
                    className="block min-w-0 rounded-xl transition-colors hover:bg-slate-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    <p className="mb-1 font-bold leading-snug text-[18px] text-slate-900 hover:text-sky-600">
                      {formatScheduleTitle(s.title)}
                    </p>
                    {s.site?.name && (
                      <p className="mb-1 flex items-center gap-1.5 font-semibold text-[16px] leading-6 text-slate-700">
                        <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                        {s.site.name}
                      </p>
                    )}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[15px] text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {formatDate(s.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <ScheduleTime startTime={s.startTime ?? null} endTime={s.endTime ?? null} variant="list" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
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

      <Link
        href="/schedules/new"
        className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
        aria-label="予定を追加"
      >
        <Plus className="h-5 w-5" />
        <span>予定を追加</span>
      </Link>
    </div>
  );
}