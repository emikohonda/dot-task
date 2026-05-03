// apps/web/src/app/sites/_components/CompanyQuickCreateInput.tsx
"use client";

import * as React from "react";

export type CompanyOption = {
    id: string;
    name: string;
    contacts: Array<{
        id: string;
        name: string | null;
        phone?: string | null;
        email?: string | null;
    }>;
};

type Props = {
    companies: CompanyOption[];
    companyId: string;
    companyNameToCreate: string;
    disabled?: boolean;
    error?: string;
    onChange: (value: { companyId: string; companyNameToCreate: string }) => void;
};

export default function CompanyQuickCreateInput({
    companies,
    companyId,
    companyNameToCreate,
    disabled = false,
    error,
    onChange,
}: Props) {
    const [inputValue, setInputValue] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // 選択済み会社の表示名
    const selectedCompany = companies.find((c) => c.id === companyId);
    const selectedLabel = selectedCompany?.name ?? companyNameToCreate ?? "";

    // 何か選択済みか
    const hasSelection = Boolean(companyId || companyNameToCreate);

    // キーワードで候補を絞り込む
    const keyword = inputValue.trim();
    const filtered = keyword
        ? companies.filter((c) =>
            c.name.toLowerCase().includes(keyword.toLowerCase())
        )
        : companies.slice(0, 3); // 未入力時は先頭3件を「よく使う」として表示

    // 完全一致チェック（新規追加ボタンを出すかどうか）
    const exactMatch = companies.some(
        (c) => c.name.toLowerCase() === keyword.toLowerCase()
    );
    const showAddButton = keyword.length > 0 && !exactMatch;

    // 外側クリックで閉じる
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setInputValue("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 既存会社を選択
    const handleSelect = (company: CompanyOption) => {
        onChange({ companyId: company.id, companyNameToCreate: "" });
        setInputValue("");
        setIsOpen(false);
    };

    // 新規会社名として追加
    const handleAddNew = () => {
        onChange({ companyId: "", companyNameToCreate: keyword });
        setInputValue("");
        setIsOpen(false);
    };

    // 選択を解除
    const handleClear = () => {
        onChange({ companyId: "", companyNameToCreate: "" });
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
                            companyNameToCreate
                                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                                : "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
                        ].join(" ")}
                        title={`${selectedLabel} を外す`}
                    >
                        <span className="truncate">{selectedLabel}</span>

                        {companyNameToCreate && (
                            <span className="shrink-0 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                新規
                            </span>
                        )}

                        <span
                            aria-hidden="true"
                            className={[
                                "shrink-0 font-bold",
                                companyNameToCreate ? "text-amber-800" : "text-sky-800",
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
                    placeholder="会社名を入力・検索"
                    className={[
                        baseInputClass,
                        error ? "border-rose-300" : "border-slate-200",
                    ].join(" ")}
                />
            )}

            {/* エラーメッセージ */}
            {error && (
                <p className="mt-1 text-xs text-rose-600">{error}</p>
            )}

            {/* ドロップダウン候補 */}
            {isOpen && !hasSelection && !disabled && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    {/* よく使う / 候補ラベル */}
                    {!keyword && companies.length > 0 && (
                        <div className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            よく使う
                        </div>
                    )}

                    {/* 候補リスト */}
                    {filtered.length > 0 && (
                        <ul className="max-h-52 overflow-y-auto">
                            {filtered.map((company) => (
                                <li key={company.id}>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()} // blur前に選択させる
                                        onClick={() => handleSelect(company)}
                                        className="flex w-full items-center px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-sky-50 transition-colors"
                                    >
                                        <span className="font-medium">{company.name}</span>
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
                            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold shrink-0">
                                ＋
                            </span>
                            「{keyword}」を元請会社として追加
                        </button>
                    )}

                    {/* 登録済み会社が0件 */}
                    {!keyword && companies.length === 0 && (
                        <div className="px-3 py-3 text-sm text-slate-400">
                            登録済みの元請会社がありません
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
