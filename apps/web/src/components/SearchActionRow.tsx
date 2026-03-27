// apps/web/src/components/SearchActionRow.tsx
"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

export function SearchActionRow({
  onSearch,
  onReset,
  showReset,
  loading,
  isDirty,
  hasFilter,
  count,
}: {
  onSearch: () => void;
  onReset: () => void;
  showReset: boolean;
  loading: boolean;
  isDirty: boolean;
  hasFilter: boolean;
  count: number;
}) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={onSearch}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
      >
        <Search className="h-3.5 w-3.5" />
        検索
      </button>

      {showReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <X className="h-3.5 w-3.5" />
          リセット
        </button>
      )}

      {loading && (
         <span className="text-center text-xs text-slate-400">検索中…</span>
      )}
      {!loading && isDirty && (
        <span className="text-center text-xs text-amber-500">検索を押すと反映されます</span>
      )}
      {!loading && !isDirty && hasFilter && (
        <span className="text-center text-xs text-slate-400">検索結果 {count} 件</span>
      )}
    </div>
  );
}
