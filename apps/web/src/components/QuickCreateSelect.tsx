// apps/web/src/components/QuickCreateSelect.tsx
"use client";

import * as React from "react";

type QuickCreateOption = {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
};

type Props = {
  options: QuickCreateOption[];
  selectedId: string;
  nameToCreate: string;
  disabled?: boolean;
  error?: string;
  placeholder: string;
  addLabel: string;
  emptyLabel: string;
  showCompletedBadge?: boolean;
  onChange: (value: { selectedId: string; nameToCreate: string }) => void;
};

function toYmd(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null;
}

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isCompletedOption(option: QuickCreateOption) {
  const endDate = toYmd(option.endDate);
  if (!endDate) return false;
  return endDate < todayYmd();
}

export default function QuickCreateSelect({
  options,
  selectedId,
  nameToCreate,
  disabled = false,
  error,
  placeholder,
  addLabel,
  emptyLabel,
  showCompletedBadge = false,
  onChange,
}: Props) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.id === selectedId);
  const selectedLabel = selectedOption?.name ?? nameToCreate ?? "";
  const selectedIsCompleted =
    showCompletedBadge && selectedOption ? isCompletedOption(selectedOption) : false;

  const hasSelection = Boolean(selectedId || nameToCreate);

  const keyword = inputValue.trim();
  const filtered = keyword
    ? options.filter((o) =>
        o.name.toLowerCase().includes(keyword.toLowerCase())
      )
    : options.slice(0, 3);

  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === keyword.toLowerCase()
  );
  const showAddButton = keyword.length > 0 && !exactMatch;

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: QuickCreateOption) => {
    onChange({ selectedId: option.id, nameToCreate: "" });
    setInputValue("");
    setIsOpen(false);
  };

  const handleAddNew = () => {
    onChange({ selectedId: "", nameToCreate: keyword });
    setInputValue("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange({ selectedId: "", nameToCreate: "" });
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const baseInputClass =
    "mt-1 block min-w-0 w-full rounded-md border bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100";

  return (
    <div ref={containerRef} className="relative">
      {hasSelection ? (
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={[
              "inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
              nameToCreate
                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                : selectedIsCompleted
                  ? "bg-slate-100 text-slate-800 ring-1 ring-slate-300"
                  : "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
            ].join(" ")}
            title={`${selectedLabel} を外す`}
          >
            <span className="truncate">{selectedLabel}</span>

            {nameToCreate && (
              <span className="shrink-0 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                新規
              </span>
            )}

            {selectedIsCompleted && (
              <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                完了済
              </span>
            )}

            <span
              aria-hidden="true"
              className={[
                "shrink-0 font-bold",
                nameToCreate
                  ? "text-amber-800"
                  : selectedIsCompleted
                    ? "text-slate-700"
                    : "text-sky-800",
              ].join(" ")}
            >
              ×
            </span>
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className={[
            baseInputClass,
            error ? "border-rose-300" : "border-slate-200",
          ].join(" ")}
        />
      )}

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {isOpen && !hasSelection && !disabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {!keyword && options.length > 0 && (
            <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              よく使う
            </div>
          )}

          {filtered.length > 0 && (
            <ul className="max-h-52 overflow-y-auto">
              {filtered.map((option) => {
                const isCompleted =
                  showCompletedBadge && isCompletedOption(option);

                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(option)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition-colors hover:bg-sky-50"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {option.name}
                      </span>

                      {isCompleted && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                          完了済
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {keyword && filtered.length === 0 && !showAddButton && (
            <div className="px-3 py-2.5 text-sm text-slate-400">
              候補が見つかりませんでした
            </div>
          )}

          {showAddButton && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleAddNew}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                ＋
              </span>
              <span className="min-w-0">
                {"「"}
                <span className="font-semibold">{keyword.trim()}</span>
                {"」を"}
                {addLabel}
              </span>
            </button>
          )}

          {!keyword && options.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-400">
              {emptyLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}