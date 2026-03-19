// apps/web/src/app/employees/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";
import { ToastHandler } from "./ToastHandler";
import { KeywordSearchBox } from "@/components/KeywordSearchBox";
import { SearchActionRow } from "@/components/SearchActionRow";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

const PAGE_LIMIT = 20;

type Employee = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  createdAt: string;
  updatedAt: string;
};

type PaginatedEmployees = {
  items: Employee[];
  total: number;
  limit: number;
  offset: number;
};

async function fetchEmployees(params: URLSearchParams): Promise<PaginatedEmployees> {
  try {
    const res = await fetch(`${API_BASE}/employees?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
    const data = await res.json();
    if (data && Array.isArray(data.items)) return data as PaginatedEmployees;
    if (Array.isArray(data)) return { items: data, total: data.length, limit: PAGE_LIMIT, offset: 0 };
    return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
  } catch {
    return { items: [], total: 0, limit: PAGE_LIMIT, offset: 0 };
  }
}

function formatDateJp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function EmployeesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = React.useState(searchParams.get("keyword") ?? "");
  const [offset, setOffset] = React.useState(Number(searchParams.get("offset") ?? 0));
  const [total, setTotal] = React.useState(0);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(PAGE_LIMIT));
    if (!params.has("offset")) params.set("offset", "0");
    setLoading(true);
    fetchEmployees(params).then((data) => {
      setEmployees(data.items);
      setTotal(data.total);
      setLoading(false);
    });
  }, [searchParams]);

  React.useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    const nextOffset = Number(searchParams.get("offset") ?? "0");
    setOffset(Number.isFinite(nextOffset) ? nextOffset : 0);
  }, [searchParams]);

  const isDirty = keyword !== (searchParams.get("keyword") ?? "");

  const applyFilter = React.useCallback(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    params.set("offset", "0");
    router.replace(`/employees?${params.toString()}`, { scroll: false });
  }, [keyword, router]);

  const resetFilter = () => {
    setKeyword("");
    router.replace("/employees", { scroll: false });
  };

  const goToOffset = (nextOffset: number) => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    params.set("offset", String(nextOffset));
    router.replace(`/employees?${params.toString()}`, { scroll: false });
  };

  const hasFilter = !!keyword;
  const hasAny = employees.length > 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_LIMIT < total;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd   = Math.min(offset + PAGE_LIMIT, total);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="自社社員"
        title="社員名簿"
        right={
          <Link href="/employees/new" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
            ＋ 社員を追加
          </Link>
        }
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="max-w-sm">
          <KeywordSearchBox
            placeholder="氏名・役職・メールアドレス"
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

      <CardSection>
        {loading ? (
          <div className="py-6 text-center text-sm text-slate-400">読み込み中…</div>
        ) : !hasAny ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              {hasFilter ? "条件に一致する社員はありません" : "まだ社員が登録されていません"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {hasFilter ? "絞り込み条件を変えてみてください。" : "右上の「＋ 社員を追加」から登録できます。"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500">
                    <th className="border-b border-slate-200 pb-3">氏名</th>
                    <th className="border-b border-slate-200 pb-3">役職・担当</th>
                    <th className="border-b border-slate-200 pb-3">連絡先</th>
                    <th className="border-b border-slate-200 pb-3">登録日</th>
                    <th className="w-[88px] border-b border-slate-200 pb-3 text-center">詳細</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-900">
                  {employees.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-100/60 [&>td]:border-b [&>td]:border-dashed [&>td]:border-slate-200 last:[&>td]:border-b-0">
                      <td className="py-4 pr-4"><div className="font-medium">{item.name}</div></td>
                      <td className="py-4 pr-4 text-slate-700">{item.role ?? <span className="text-slate-400">—</span>}</td>
                      <td className="py-4 pr-4 text-slate-700">
                        <div>{item.phone ?? "—"}</div>
                        <div className="text-xs text-slate-500">{item.email ?? "—"}</div>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">{formatDateJp(item.createdAt)}</td>
                      <td className="w-[88px] py-4 text-center">
                        <Link href={`/employees/${item.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 hover:bg-slate-50">
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
      <ToastHandler basePath="/employees" />
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <React.Suspense fallback={<div className="py-6 text-center text-sm text-slate-400">読み込み中…</div>}>
      <EmployeesPageInner />
    </React.Suspense>
  );
}
