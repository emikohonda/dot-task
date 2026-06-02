// apps/web/src/app/settings/organization/OrganizationSettingsForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type OrganizationMe = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

type Props = {
  organization: OrganizationMe;
};

export function OrganizationSettingsForm({ organization }: Props) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();
  const isChanged = trimmedName !== organization.name;
  const canSubmit = trimmedName.length > 0 && trimmedName.length <= 100 && isChanged;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/organizations/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message ?? "自社情報の更新に失敗しました");
      }

      setMessage("自社名を更新しました");
      window.dispatchEvent(new Event("organization-updated"));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "自社情報の更新に失敗しました",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="organization-name"
          className="text-sm font-semibold text-slate-700"
        >
          自社名・ワークスペース名
        </label>
        <input
          id="organization-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="例：本田美装"
        />
        <p className="text-xs text-slate-500">{trimmedName.length}/100文字</p>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || isSaving}
        className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
      >
        {isSaving ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}