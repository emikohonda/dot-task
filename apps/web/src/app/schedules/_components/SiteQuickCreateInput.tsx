// apps/web/src/app/schedules/_components/SiteQuickCreateInput.tsx
"use client";

import * as React from "react";
import type { Site } from "@/lib/api";

type Props = {
  sites: Site[];
  siteId: string;
  siteNameToCreate: string;
  disabled?: boolean;
  error?: string;
  onChange: (value: { siteId: string; siteNameToCreate: string }) => void;
};

export default function SiteQuickCreateInput({
  sites,
  siteId,
  siteNameToCreate,
  disabled = false,
  error,
  onChange,
}: Props) {
  const [inputValue, setInputValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // 選択済み現場の表示名
  const selectedSite = sites.find((s) => s.id === siteId);
  const selectedLabel = selectedSite?.name ?? siteNameToCreate ?? "";

  // 何か選択済みか
  const hasSelection = Boolean(siteId || siteNameToCreate);

  // キーワードで候補を絞り込む
  const keyword = inputValue.trim();
  const filtered = keyword
    ? sites.filter((s) =>
        s.name.toLowerCase().includes(keyword.toLowerCase())
      )
    : sites.slice(0, 3); // 未入力時は先頭3件を「よく使う」として表示

  // 完全一致チェック（新規追加ボタンを出すかどうか）
  const exactMatch = sites.some(
    (s) => s.name.toLowerCase() === keyword.toLowerCase()
  );
  const showAddButton = keyword.length > 0 && !exactMatch;

  // 外側クリックで閉じる
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

  // 既存現場を選択
  const handleSelect = (site: Site) => {
    onChange({ siteId: site.id, siteNameToCreate: "" });
    setInputValue("");
    setIsOpen(false);
  };

  // 新規現場名として追加
  const handleAddNew = () => {
    onChange({ siteId: "", siteNameToCreate: keyword });
    setInputValue("");
    setIsOpen(false);
  };

  // 選択を解除
  const handleClear = () => {
    onChange({ siteId: "", siteNameToCreate: "" });
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const baseInputClass =
    "mt-1 block min-w-0 w-full rounded-md border bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100";

  return (
    <div ref={containerRef} className="relative">
      {/* 選択済みタグ表示 */}
      {hasSelection ? (
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={[
              "inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
              siteNameToCreate
                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                : "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
            ].join(" ")}
            title={`${selectedLabel} を外す`}
          >
            <span className="truncate">{selectedLabel}</span>

            {siteNameToCreate && (
              <span className="shrink-0 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                新規
              </span>
            )}

            <span
              aria-hidden="true"
              className={[
                "shrink-0 font-bold",
                siteNameToCreate ? "text-amber-800" : "text-sky-800",
              ].join(" ")}
            >
              ×
            </span>
          </button>
        </div>
      ) : (
        /* 入力欄 */
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
          placeholder="現場名を入力・検索"
          className={[
            baseInputClass,
            error ? "border-rose-300" : "border-slate-200",
          ].join(" ")}
        />
      )}

      {/* エラーメッセージ */}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {/* ドロップダウン候補 */}
      {isOpen && !hasSelection && !disabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* よく使う / 候補ラベル */}
          {!keyword && sites.length > 0 && (
            <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              よく使う
            </div>
          )}

          {/* 候補リスト */}
          {filtered.length > 0 && (
            <ul className="max-h-52 overflow-y-auto">
              {filtered.map((site) => (
                <li key={site.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // blur前に選択させる
                    onClick={() => handleSelect(site)}
                    className="flex w-full items-center px-3 py-2.5 text-left text-sm text-slate-800 transition-colors hover:bg-sky-50"
                  >
                    <span className="font-medium">{site.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 一致なし */}
          {keyword && filtered.length === 0 && !showAddButton && (
            <div className="px-3 py-2.5 text-sm text-slate-400">
              候補が見つかりませんでした
            </div>
          )}

          {/* 新規追加ボタン */}
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
              「{keyword}」を現場として追加
            </button>
          )}

          {/* 登録済み現場が0件 */}
          {!keyword && sites.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-400">
              登録済みの現場がありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}
