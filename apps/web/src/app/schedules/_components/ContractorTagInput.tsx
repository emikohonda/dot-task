// apps/web/src/app/schedules/_components/ContractorTagInput.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ContractorLite } from "@/lib/api";

type Props = {
    contractors: ContractorLite[];
    recentContractors?: ContractorLite[];
    selectedIds: string[];
    selectedNewNames: string[];
    onChange: (ids: string[], newNames: string[]) => void;
    disabled?: boolean;
};

export function ContractorTagInput({
    contractors,
    recentContractors,
    selectedIds,
    selectedNewNames,
    onChange,
    disabled = false,
}: Props) {
    const [keyword, setKeyword] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const trimmedKeyword = keyword.trim();

    const selectedContractors = useMemo(() => {
        return selectedIds
            .map((id) => contractors.find((c) => c.id === id))
            .filter((c): c is ContractorLite => Boolean(c));
    }, [contractors, selectedIds]);

    const quickCandidates = useMemo(() => {
        if (trimmedKeyword) return [];

        const pool = recentContractors ?? contractors;

        return pool
            .filter((c) => !selectedIds.includes(c.id))
            .slice(0, 3);
    }, [contractors, recentContractors, selectedIds, trimmedKeyword]);

    const searchCandidates = useMemo(() => {
        const kw = trimmedKeyword.toLowerCase();
        if (!kw) return [];

        return contractors
            .filter((c) => !selectedIds.includes(c.id))
            .filter((c) => c.name.toLowerCase().includes(kw))
            .slice(0, 8);
    }, [contractors, selectedIds, trimmedKeyword]);

    const showAddNew = useMemo(() => {
        if (!trimmedKeyword) return false;

        const lowerKeyword = trimmedKeyword.toLowerCase();

        const exactExisting = contractors.some(
            (contractor) => contractor.name.trim().toLowerCase() === lowerKeyword
        );
        if (exactExisting) return false;

        const alreadySelectedNew = selectedNewNames.some(
            (name) => name.trim().toLowerCase() === lowerKeyword
        );

        return !alreadySelectedNew;
    }, [contractors, selectedNewNames, trimmedKeyword]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setKeyword("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addContractor = (id: string) => {
        if (disabled) return;
        if (selectedIds.includes(id)) return;

        onChange([...selectedIds, id], selectedNewNames);
        setKeyword("");
        setIsOpen(false);
    };

    const removeContractor = (id: string) => {
        if (disabled) return;
        onChange(
            selectedIds.filter((selectedId) => selectedId !== id),
            selectedNewNames
        );
    };

    const addNewName = () => {
        if (disabled) return;
        if (!trimmedKeyword) return;

        const lowerKeyword = trimmedKeyword.toLowerCase();
        const alreadySelectedNew = selectedNewNames.some(
            (name) => name.trim().toLowerCase() === lowerKeyword
        );

        if (alreadySelectedNew) return;

        onChange(selectedIds, [...selectedNewNames, trimmedKeyword]);
        setKeyword("");
        setIsOpen(false);
    };

    const removeNewName = (name: string) => {
        if (disabled) return;
        onChange(
            selectedIds,
            selectedNewNames.filter((selectedName) => selectedName !== name)
        );
    };

    return (
        <div className="space-y-3">
            <div ref={containerRef} className="relative">
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                        setKeyword(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                    disabled={disabled}
                    className="block min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="外注先名を入力・検索"
                />

                {isOpen && !disabled && (
                    <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        {!trimmedKeyword && quickCandidates.length > 0 && (
                            <>
                                <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    よく使う
                                </div>
                                <ul className="max-h-52 overflow-y-auto">
                                    {quickCandidates.map((contractor) => (
                                        <li key={contractor.id}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => addContractor(contractor.id)}
                                                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition-colors hover:bg-sky-50"
                                            >
                                                <span className="min-w-0 truncate font-medium">
                                                    {contractor.name}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {!trimmedKeyword && quickCandidates.length === 0 && (
                            <p className="px-3 py-3 text-sm text-slate-400">
                                {contractors.length === 0
                                    ? "協力会社がまだ登録されていません"
                                    : "候補がありません"}
                            </p>
                        )}

                        {trimmedKeyword && (
                            <>
                                {searchCandidates.length > 0 ? (
                                    <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
                                        {searchCandidates.map((contractor) => (
                                            <li key={contractor.id}>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => addContractor(contractor.id)}
                                                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[15px] text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
                                                >
                                                    <span className="min-w-0 truncate font-semibold">{contractor.name}</span>
                                                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">追加</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : !showAddNew ? (
                                    <p className="px-3 py-3 text-sm text-slate-500">
                                        該当する協力会社がありません
                                    </p>
                                ) : null}

                                {showAddNew && (
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={addNewName}
                                        className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-3 text-left text-[15px] font-medium text-amber-700 transition-colors hover:bg-amber-50 active:bg-amber-100"
                                    >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-base font-bold text-white">＋</span>
                                        <span className="min-w-0">
                                            「<span className="font-semibold">{trimmedKeyword}</span>
                                            」を外注先として追加
                                        </span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {(selectedContractors.length > 0 || selectedNewNames.length > 0) && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">選択中</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedContractors.map((contractor) => (
                            <button
                                key={contractor.id}
                                type="button"
                                onClick={() => removeContractor(contractor.id)}
                                disabled={disabled}
                                className="inline-flex max-w-full items-center gap-1 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-800 ring-1 ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                                title={`${contractor.name} を外す`}
                            >
                                <span className="truncate">{contractor.name}</span>
                                <span aria-hidden="true" className="shrink-0 text-sky-700">
                                    ×
                                </span>
                            </button>
                        ))}

                        {selectedNewNames.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => removeNewName(name)}
                                disabled={disabled}
                                className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-900 ring-1 ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                                title={`${name} を外す`}
                            >
                                <span className="truncate">{name}</span>
                                <span className="shrink-0 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                                    新規
                                </span>
                                <span aria-hidden="true" className="shrink-0 text-amber-800">
                                    ×
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
