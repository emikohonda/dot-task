// apps/web/src/app/schedules/_components/EmployeeTagInput.tsx
"use client";

import { useMemo, useState } from "react";
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

  const addEmployee = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) return;

    onChange([...selectedIds, id], selectedNewNames);
    setKeyword("");
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
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        disabled={disabled}
        className="block min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        placeholder="社員名を入力・検索"
      />

      {quickCandidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">よく使う</p>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex w-max gap-2">
              {quickCandidates.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => addEmployee(employee.id)}
                  disabled={disabled}
                  className="max-w-[160px] shrink-0 truncate rounded-full bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 transition-colors active:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                  title={employee.name}
                >
                  {employee.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {trimmedKeyword.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">候補</p>

          <div className="rounded-md border border-slate-200 bg-white">
            {searchCandidates.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {searchCandidates.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => addEmployee(employee.id)}
                    disabled={disabled}
                    className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[15px] text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {employee.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      追加
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-3 text-sm text-slate-500">
                該当する社員がいません
              </p>
            )}

            {showAddNew && (
              <button
                type="button"
                onClick={addNewName}
                disabled={disabled}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-3 text-left text-[15px] font-medium text-sky-800 transition-colors hover:bg-sky-50 active:bg-sky-100 disabled:cursor-not-allowed disabled:text-slate-400"
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
          </div>
        </div>
      )}

      {employees.length === 0 && !trimmedKeyword && (
        <p className="text-xs text-slate-500">
          社員がまだ登録されていません。社員名を入力すると、この予定の保存時に登録できます。
        </p>
      )}
    </div>
  );
}