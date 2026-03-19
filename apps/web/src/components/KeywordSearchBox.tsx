// apps/web/src/components/KeywordSearchBox.tsx
"use client";

import * as React from "react";
import { Search } from "lucide-react";

export function KeywordSearchBox({
  label = "キーワード",
  placeholder,
  value,
  onChange,
  onSearch,
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </div>
    </div>
  );
}
