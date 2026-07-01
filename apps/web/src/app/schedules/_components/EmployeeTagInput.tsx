// apps/web/src/app/schedules/_components/EmployeeTagInput.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EmployeeLite } from "@/lib/fetchers/employees";

type Props = {
  employees: EmployeeLite[];
  recentEmployees?: EmployeeLite[];
  selectedIds: string[];
  selectedNewNames: string[];
  onChange: (ids: string[], newNames: string[]) => void;
  disabled?: boolean;
};

export function EmployeeTagInput({
  employees,
  recentEmployees,
  selectedIds,
  selectedNewNames,
  onChange,
  disabled = false,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedKeyword = keyword.trim();

  const selectedEmployees = useMemo(() => {
    return selectedIds
      .map((id) => employees.find((e) => e.id === id))
      .filter((e): e is EmployeeLite => Boolean(e));
  }, [employees, selectedIds]);

  const quickCandidates = useMemo(() => {
    if (trimmedKeyword) return [];

    const pool = recentEmployees ?? employees;

    return pool.filter((e) => !selectedIds.includes(e.id)).slice(0, 3);
  }, [employees, recentEmployees, selectedIds, trimmedKeyword]);

  const searchCandidates = useMemo(() => {
    const kw = trimmedKeyword.toLowerCase();
    if (!kw) return [];

    return employees
      .filter((e) => !selectedIds.includes(e.id))
      .filter((e) => e.name.toLowerCase().includes(kw))
      .slice(0, 8);
  }, [employees, selectedIds, trimmedKeyword]);

  const showAddNew = useMemo(() => {
    if (!trimmedKeyword) return false;

    const lowerKeyword = trimmedKeyword.toLowerCase();

    const exactExisting = employees.some(
      (employee) => employee.name.trim().toLowerCase() === lowerKeyword
    );
    if (exactExisting) return false;

    const alreadySelectedNew = selectedNewNames.some(
      (name) => name.trim().toLowerCase() === lowerKeyword
    );

    return !alreadySelectedNew;
  }, [employees, selectedNewNames, trimmedKeyword]);

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

  const addEmployee = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) return;

    onChange([...selectedIds, id], selectedNewNames);
    setKeyword("");
    setIsOpen(false);
  };

  const removeEmployee = (id: string) => {
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
          placeholder="社員名を入力・検索"
        />

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {!trimmedKeyword && quickCandidates.length > 0 && (
              <>
                <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  よく使う
                </div>
                <ul className="max-h-52 overflow-y-auto">
                  {quickCandidates.map((employee) => (
                    <li key={employee.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addEmployee(employee.id)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition-colors hover:bg-sky-50"
                      >
                        <span className="min-w-0 truncate font-medium">
                          {employee.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!trimmedKeyword && quickCandidates.length === 0 && (
              <p className="px-3 py-3 text-sm text-slate-400">
                {employees.length === 0
                  ? "社員がまだ登録されていません。社員名を入力すると、この予定の保存時に登録できます。"
                  : "候補がありません"}
              </p>
            )}

            {trimmedKeyword && (
              <>
                {searchCandidates.length > 0 ? (
                  <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
                    {searchCandidates.map((employee) => (
                      <li key={employee.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addEmployee(employee.id)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[15px] text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
                        >
                          <span className="min-w-0 truncate font-semibold">
                            {employee.name}
                          </span>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            追加
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-3 text-sm text-slate-500">
                    該当する社員がいません
                  </p>
                )}

                {showAddNew && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addNewName}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-3 text-left text-[15px] font-medium text-sky-800 transition-colors hover:bg-sky-50 active:bg-sky-100"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-bold text-sky-700">
                      ＋
                    </span>
                    <span className="min-w-0">
                      「<span className="font-semibold">{trimmedKeyword}</span>
                      」を社員として追加
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {(selectedEmployees.length > 0 || selectedNewNames.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">選択中</p>
          <div className="flex flex-wrap gap-2">
            {selectedEmployees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => removeEmployee(employee.id)}
                disabled={disabled}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-800 ring-1 ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                title={`${employee.name} を外す`}
              >
                <span className="truncate">{employee.name}</span>
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
