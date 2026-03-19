// apps/web/src/components/Combobox.tsx
"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";

export type ComboboxOption = { id: string; name: string };

export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  // open時にinputへfocus
  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // 外クリックで閉じる
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div ref={containerRef} className="relative">
        {/* トリガーボタン（clearと兄弟構造）*/}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((prev) => !prev);
            }
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
        >
          <span className={selected ? "text-slate-800" : "text-slate-400"}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* clearボタン（絶対配置・兄弟要素）*/}
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* ドロップダウン */}
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 p-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="検索..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <ul role="listbox" className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-slate-400">該当なし</li>
              ) : (
                filtered.map((o) => (
                  <li
                    key={o.id}
                    role="option"
                    aria-selected={o.id === value}
                    onClick={() => handleSelect(o.id)}
                    className={[
                      "cursor-pointer px-3 py-2.5 text-sm transition hover:bg-sky-50",
                      o.id === value ? "bg-sky-50 font-semibold text-sky-700" : "text-slate-700",
                    ].join(" ")}
                  >
                    {o.name}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
