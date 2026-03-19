// apps/web/src/app/schedules/SchedulesClient.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { patchScheduleStatus } from "@/lib/schedulesApi";
import {
  STATUS_META,
  SCHEDULE_STATUS,
  type ScheduleStatus,
} from "@/lib/scheduleStatus";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";
import { Combobox } from "@/components/Combobox";
import { KeywordSearchBox } from "@/components/KeywordSearchBox";
import { SearchActionRow } from "@/components/SearchActionRow";
import { Calendar, Clock, Sun } from "lucide-react";
import { ScheduleTime } from "@/app/schedules/_components/ScheduleTime";
import type { Schedule } from "@/lib/fetchers/schedules";
import type { ComboboxOption } from "@/components/Combobox";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

const PAGE_LIMIT = 20;

type PaginatedSchedules = {
  items: Schedule[];
  total: number;
  limit: number;
  offset: number;
};

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
    // pagination形式 or 配列の両方に対応
    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return list.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }));
  } catch {
    return [];
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function contractorLabel(s: Schedule) {
  const names = s.contractors?.map((x) => x.contractor?.name ?? null).filter((n): n is string => Boolean(n && n.trim())) ?? [];
  return names.length ? names.join(" / ") : null;
}

function employeesLabel(s: Schedule) {
  const names = s.employees?.map((x) => x.employee?.name ?? null).filter((n): n is string => Boolean(n && n.trim())) ?? [];
  return names.length ? names.join(" / ") : null;
}

export default function SchedulesClient({ initialSchedules }: { initialSchedules: Schedule[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword]           = React.useState(searchParams.get("keyword")      ?? "");
  const [status, setStatus]             = React.useState(searchParams.get("status")       ?? "");
  const [dateFrom, setDateFrom]         = React.useState(searchParams.get("dateFrom")     ?? "");
  const [dateTo, setDateTo]             = React.useState(searchParams.get("dateTo")       ?? "");
  const [siteId, setSiteId]             = React.useState<string | null>(searchParams.get("siteId"));
  const [employeeId, setEmployeeId]     = React.useState<string | null>(searchParams.get("employeeId"));
  const [contractorId, setContractorId] = React.useState<string | null>(searchParams.get("contractorId"));
  const [offset, setOffset]             = React.useState(Number(searchParams.get("offset") ?? 0));

  const [siteOptions, setSiteOptions]             = React.useState<ComboboxOption[]>([]);
  const [employeeOptions, setEmployeeOptions]     = React.useState<ComboboxOption[]>([]);
  const [contractorOptions, setContractorOptions] = React.useState<ComboboxOption[]>([]);

  const [schedules, setSchedules] = React.useState<Schedule[]>(initialSchedules);
  const [total, setTotal]         = React.useState(initialSchedules.length);
  const [loading, setLoading]     = React.useState(false);
  const [savingId, setSavingId]   = React.useState<string | null>(null);

  // ── 初回：候補データをロード ──
  React.useEffect(() => {
    fetchOptions("/sites?limit=200").then(setSiteOptions);
    fetchOptions("/employees?limit=200").then(setEmployeeOptions);
    fetchOptions("/contractors?limit=200").then(setContractorOptions);
  }, []);

  // ── URL変化時にデータ取得（back/forward・URL直打ち対応）──
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const nextOffset = Number(searchParams.get("offset") ?? "0");
    params.set("limit", String(PAGE_LIMIT));
    params.set("offset", String(Number.isFinite(nextOffset) ? nextOffset : 0));
    setLoading(true);
    fetchSchedules(params).then((data) => {
      setSchedules(data.items);
      setTotal(data.total);
      setLoading(false);
    });
  }, [searchParams]);

  // ── state をURLと同期 ──
  React.useEffect(() => {
    setKeyword(searchParams.get("keyword")      ?? "");
    setStatus(searchParams.get("status")        ?? "");
    setDateFrom(searchParams.get("dateFrom")    ?? "");
    setDateTo(searchParams.get("dateTo")        ?? "");
    setSiteId(searchParams.get("siteId"));
    setEmployeeId(searchParams.get("employeeId"));
    setContractorId(searchParams.get("contractorId"));
    const nextOffset = Number(searchParams.get("offset") ?? "0");
    setOffset(Number.isFinite(nextOffset) ? nextOffset : 0);
  }, [searchParams]);

  // ── 検索：URLを更新するだけ ──
  const applyFilter = React.useCallback(() => {
    const params = new URLSearchParams();
    if (keyword)      params.set("keyword",      keyword);
    if (status)       params.set("status",        status);
    if (dateFrom)     params.set("dateFrom",      dateFrom);
    if (dateTo)       params.set("dateTo",        dateTo);
    if (siteId)       params.set("siteId",        siteId);
    if (employeeId)   params.set("employeeId",    employeeId);
    if (contractorId) params.set("contractorId",  contractorId);
    params.set("offset", "0");
    router.replace(`/schedules?${params.toString()}`, { scroll: false });
  }, [keyword, status, dateFrom, dateTo, siteId, employeeId, contractorId, router]);

  const resetFilter = () => {
    setKeyword(""); setStatus(""); setDateFrom(""); setDateTo("");
    setSiteId(null); setEmployeeId(null); setContractorId(null);
    router.replace("/schedules", { scroll: false });
  };

  const goToOffset = (nextOffset: number) => {
    const params = new URLSearchParams();
    if (keyword)      params.set("keyword",      keyword);
    if (status)       params.set("status",        status);
    if (dateFrom)     params.set("dateFrom",      dateFrom);
    if (dateTo)       params.set("dateTo",        dateTo);
    if (siteId)       params.set("siteId",        siteId);
    if (employeeId)   params.set("employeeId",    employeeId);
    if (contractorId) params.set("contractorId",  contractorId);
    params.set("offset", String(nextOffset));
    router.replace(`/schedules?${params.toString()}`, { scroll: false });
  };

  const hasFilter = !!(keyword || status || dateFrom || dateTo || siteId || employeeId || contractorId);

  const isDirty =
    keyword      !== (searchParams.get("keyword")      ?? "") ||
    status       !== (searchParams.get("status")       ?? "") ||
    dateFrom     !== (searchParams.get("dateFrom")     ?? "") ||
    dateTo       !== (searchParams.get("dateTo")       ?? "") ||
    (siteId       ?? "") !== (searchParams.get("siteId")       ?? "") ||
    (employeeId   ?? "") !== (searchParams.get("employeeId")   ?? "") ||
    (contractorId ?? "") !== (searchParams.get("contractorId") ?? "");

  const hasAny       = schedules.length > 0;
  const allCancelled = hasAny && schedules.every((s) => s.status === "CANCELLED");
  const hasPrev      = offset > 0;
  const hasNext      = offset + PAGE_LIMIT < total;
  const rangeStart   = total === 0 ? 0 : offset + 1;
  const rangeEnd     = Math.min(offset + PAGE_LIMIT, total);

  const updateLocal = (id: string, patch: Partial<Schedule>) =>
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const onChangeStatus = async (id: string, next: ScheduleStatus) => {
    const current = schedules.find((s) => s.id === id)?.status;
    if (!current || current === next) return;
    updateLocal(id, { status: next });
    setSavingId(id);
    try {
      await patchScheduleStatus(id, next);
    } catch {
      updateLocal(id, { status: current });
      alert("更新に失敗しました。通信状態を確認してもう一度お試しください。");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="予定一覧"
        title="全現場の予定"
        right={
          <div className="flex items-center gap-2">
            <Link href="/schedules/today"
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100">
              <Sun className="h-4 w-4" />今日の予定
            </Link>
            <Link href="/schedules/new"
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
              ＋ 予定を追加
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KeywordSearchBox placeholder="タイトル・現場名・メモ" value={keyword} onChange={setKeyword} onSearch={applyFilter} />
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">ステータス</p>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100">
              <option value="">すべての状態</option>
              <option value="TODO">未着手</option>
              <option value="DOING">進行中</option>
              <option value="HOLD">保留</option>
              <option value="DONE">完了</option>
              <option value="CANCELLED">中止</option>
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">開始日</p>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">終了日</p>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100" />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Combobox label="現場"     options={siteOptions}       value={siteId}       onChange={setSiteId}       placeholder="現場で絞り込む" />
          <Combobox label="社員"     options={employeeOptions}   value={employeeId}   onChange={setEmployeeId}   placeholder="社員で絞り込む" />
          <Combobox label="協力会社" options={contractorOptions} value={contractorId} onChange={setContractorId} placeholder="協力会社で絞り込む" />
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

      {allCancelled && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          いま表示されている予定はすべて「中止」です。記録として残しつつ、状態がわかるようにしています。
        </div>
      )}

      <CardSection>
        {!hasAny ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              {hasFilter ? "条件に一致する予定はありません" : "予定はまだありません"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {hasFilter ? "絞り込み条件を変えてみてください。" : "右上の「＋ 予定を追加」から登録できます。"}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {schedules.map((s) => {
                const meta = STATUS_META[s.status];
                const cancelled = !!meta.isCancelled;
                const contractorsText = contractorLabel(s);
                const employeesText = employeesLabel(s);
                return (
                  <li key={s.id} className={["group py-3 transition-all duration-500", cancelled ? "opacity-60" : "opacity-100"].join(" ")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/schedules/${s.id}`}
                          className="group mb-2 inline-flex items-center gap-1 truncate font-medium text-slate-900 transition-colors hover:text-sky-600">
                          <span className={["truncate font-semibold text-[17px] leading-tight", cancelled ? "text-slate-500" : ""].join(" ")}>
                            {s.title}
                          </span>
                          <span className="text-[11px] opacity-0 transition group-hover:opacity-60">（編集）</span>
                        </Link>
                        <div className={["mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-600", cancelled ? "line-through opacity-70" : ""].join(" ")}>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{formatDate(s.date)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <ScheduleTime startTime={s.startTime ?? null} endTime={s.endTime ?? null} variant="list" />
                          </span>
                        </div>
                        {s.site?.name    && <p className="mt-0.5 text-[13px] text-slate-600">現場名：{s.site.name}</p>}
                        {employeesText   && <p className="mt-0.5 text-[13px] text-slate-600">社員：{employeesText}</p>}
                        {contractorsText && <p className="mt-0.5 text-[13px] text-slate-600">協力会社：{contractorsText}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span>
                        <select value={s.status} onChange={(e) => onChangeStatus(s.id, e.target.value as ScheduleStatus)}
                          disabled={savingId === s.id}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm">
                          {SCHEDULE_STATUS.map((st) => (
                            <option key={st} value={st}>{STATUS_META[st].label}</option>
                          ))}
                        </select>
                        {savingId === s.id && <span className="text-xs text-slate-500">更新中…</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {total > PAGE_LIMIT && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">{rangeStart}〜{rangeEnd}件 / 全{total}件</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => goToOffset(offset - PAGE_LIMIT)} disabled={!hasPrev || loading}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    ← 前へ
                  </button>
                  <button type="button" onClick={() => goToOffset(offset + PAGE_LIMIT)} disabled={!hasNext || loading}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    次へ →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardSection>
    </div>
  );
}