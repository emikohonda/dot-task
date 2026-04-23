// apps/web/src/app/contractors/ContractorsClient.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardSection } from "@/components/CardSection";
import { KeywordSearchBox } from "@/components/KeywordSearchBox";
import { SearchActionRow } from "@/components/SearchActionRow";
import { FloatingAddButton } from "@/components/FloatingAddButton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

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

async function fetchContractors(params: URLSearchParams): Promise<PaginatedContractors> {
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

function formatDateJp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatPrimaryContact(contacts?: Contact[]) {
  const list = contacts ?? [];
  const firstName = list[0]?.name?.trim();

  if (!firstName) return "担当者が登録されていません";

  const rest = list.slice(1).filter((c) => (c.name ?? "").trim()).length;
  return rest > 0 ? `👤 ${firstName} +${rest}` : `👤 ${firstName}`;
}

export function ContractorsClient({
  initialData,
}: {
  initialData: PaginatedContractors;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const appliedKeyword = searchParams.get("keyword") ?? "";

  const [keyword, setKeyword] = React.useState(appliedKeyword);
  const [offset, setOffset] = React.useState(Number(searchParams.get("offset") ?? 0));
  const [total, setTotal] = React.useState(initialData.total);
  const [contractors, setContractors] = React.useState<Contractor[]>(initialData.items);
  const [loading, setLoading] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(!!appliedKeyword);

  const isFirstRender = React.useRef(true);

  const isDefaultState =
    !searchParams.get("keyword") &&
    !searchParams.get("offset");

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isDefaultState) return;
    }

    const params = new URLSearchParams(searchParams.toString());
    const nextOffset = Number(searchParams.get("offset") ?? "0");

    params.set("limit", String(PAGE_LIMIT));
    params.set("offset", String(Number.isFinite(nextOffset) ? nextOffset : 0));

    setLoading(true);

    fetchContractors(params)
      .then((data) => {
        setContractors(data.items);
        setTotal(data.total);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams]);

  React.useEffect(() => {
    const nextKeyword = searchParams.get("keyword") ?? "";
    setKeyword(nextKeyword);

    const nextOffset = Number(searchParams.get("offset") ?? "0");
    setOffset(Number.isFinite(nextOffset) ? nextOffset : 0);

    if (nextKeyword) {
      setFilterOpen(true);
    }
  }, [searchParams]);

  const hasFilter = !!appliedKeyword;
  const isDirty = keyword !== appliedKeyword;

  const applyFilter = React.useCallback(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    params.set("offset", "0");
    router.replace(`/contractors?${params.toString()}`, { scroll: false });
  }, [keyword, router]);

  const resetFilter = React.useCallback(() => {
    setKeyword("");
    router.replace("/contractors", { scroll: false });
  }, [router]);

  const goToOffset = React.useCallback(
    (nextOffset: number) => {
      const params = new URLSearchParams();
      if (appliedKeyword) params.set("keyword", appliedKeyword);
      params.set("offset", String(nextOffset));
      router.replace(`/contractors?${params.toString()}`, { scroll: false });
    },
    [appliedKeyword, router]
  );

  const hasAny = contractors.length > 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_LIMIT < total;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + PAGE_LIMIT, total);

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-2xl font-bold leading-none text-slate-900">
        外注先一覧
      </h1>

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
          aria-controls="contractor-filter-panel"
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
          id="contractor-filter-panel"
          className={[
            "transition-all duration-300 ease-in-out",
            filterOpen
              ? "max-h-[400px] overflow-visible opacity-100"
              : "max-h-0 overflow-hidden opacity-0",
          ].join(" ")}
        >
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <div className="max-w-sm">
              <KeywordSearchBox
                placeholder="外注先名・住所・担当者名"
                value={keyword}
                onChange={setKeyword}
                onSearch={applyFilter}
              />
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
              {hasFilter
                ? "条件に一致する外注先はありません"
                : "まだ外注先が登録されていません"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {hasFilter
                ? "絞り込み条件を変えてみてください。"
                : "右下の「＋ 外注先を追加」から登録できます。"}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {contractors.map((item) => (
                <li key={item.id} className="py-4">
                  <Link
                    href={`/contractors/${item.id}`}
                    className="group flex items-center justify-between rounded-xl transition-colors hover:bg-slate-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    <p className="text-[18px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-sky-600">
                      {item.name}
                    </p>
                    <span className="ml-3 shrink-0 text-slate-400">›</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="border-b border-slate-200 pb-3">外注先名</th>
                    <th className="border-b border-slate-200 pb-3">担当</th>
                    <th className="border-b border-slate-200 pb-3">住所</th>
                    <th className="border-b border-slate-200 pb-3">連絡先</th>
                    <th className="border-b border-slate-200 pb-3">登録日</th>
                    <th className="w-[88px] border-b border-slate-200 pb-3 text-center">
                      詳細
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-900">
                  {contractors.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-100/60 [&>td]:border-b [&>td]:border-dashed [&>td]:border-slate-200 last:[&>td]:border-b-0"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">
                        {formatPrimaryContact(item.contacts)}
                      </td>
                      <td className="py-4 pr-4 text-slate-700">
                        {item.postalCode || item.address ? (
                          <>
                            {item.postalCode && (
                              <span className="text-xs text-slate-500">
                                〒{item.postalCode}{" "}
                              </span>
                            )}
                            {item.address ?? ""}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-4 pr-4 text-slate-700">
                        <div>{item.phone ?? "—"}</div>
                        <div className="text-xs text-slate-500">{item.email ?? "—"}</div>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">
                        {formatDateJp(item.createdAt)}
                      </td>
                      <td className="w-[88px] py-4 text-center">
                        <Link
                          href={`/contractors/${item.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 hover:bg-slate-50"
                        >
                          開く
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total > PAGE_LIMIT && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  {rangeStart}〜{rangeEnd}件 / 全{total}件
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

      <FloatingAddButton href="/contractors/new" label="外注先を追加" />
    </div>
  );
}