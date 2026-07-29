// apps/web/src/app/setup/organization/OrganizationSetupForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  EMPLOYEE_RANGE_OPTIONS,
  INDUSTRY_OPTIONS,
  PREFECTURE_OPTIONS,
} from "@/lib/constants/organization-options";

export function OrganizationSetupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [employeeRange, setEmployeeRange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();

  const canSubmit =
    trimmedName.length > 0 &&
    trimmedName.length <= 100 &&
    industry.length > 0 &&
    prefecture.length > 0 &&
    employeeRange.length > 0 &&
    !isSaving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          industry,
          prefecture,
          employeeRange,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message ?? "新規登録に失敗しました");
      }

      router.replace("/calendar");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "新規登録に失敗しました",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const selectClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="organization-name"
          className="text-sm font-semibold text-slate-700"
        >
          会社名・個人名・屋号
        </label>
        <input
          id="organization-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="例：本田美装"
        />
        <p className="text-xs text-slate-500">
          {trimmedName.length}/100文字
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="industry"
          className="text-sm font-semibold text-slate-700"
        >
          業種
        </label>
        <select
          id="industry"
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          required
          className={selectClassName}
        >
          <option value="">選択してください</option>
          {INDUSTRY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="prefecture"
          className="text-sm font-semibold text-slate-700"
        >
          活動エリア
        </label>
        <select
          id="prefecture"
          value={prefecture}
          onChange={(event) => setPrefecture(event.target.value)}
          required
          className={selectClassName}
        >
          <option value="">選択してください</option>
          {PREFECTURE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="employee-range"
          className="text-sm font-semibold text-slate-700"
        >
          事業規模
        </label>
        <select
          id="employee-range"
          value={employeeRange}
          onChange={(event) => setEmployeeRange(event.target.value)}
          required
          className={selectClassName}
        >
          <option value="">選択してください</option>
          {EMPLOYEE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSaving ? "登録中..." : "はじめる"}
      </button>
    </form>
  );
}
