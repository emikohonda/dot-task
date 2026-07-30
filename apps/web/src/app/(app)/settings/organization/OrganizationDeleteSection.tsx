// apps/web/src/app/settings/organization/OrganizationDeleteSection.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

type OrganizationDeleteSectionProps = {
  role: OrganizationRole;
};

export function OrganizationDeleteSection({
  role,
}: OrganizationDeleteSectionProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDeleteOrganization = role === "OWNER";

  async function handleDeleteOrganization() {
    if (isDeleting || !canDeleteOrganization) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/organizations/me", {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message ?? "組織の削除に失敗しました");
      }

      router.replace("/logout");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "組織の削除に失敗しました",
      );
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <section className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div>
          <h2 className="text-base font-bold text-rose-700">組織削除</h2>

          {canDeleteOrganization ? (
            <p className="mt-1 text-sm leading-6 text-rose-700">
              組織を削除すると、この組織に登録された現場・予定・取引先・外注先・社員などのデータも削除されます。
              この操作は元に戻せません。
            </p>
          ) : (
            <p className="mt-1 text-sm leading-6 text-rose-700">
              組織の削除はオーナーのみ操作できます。
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {canDeleteOrganization && (
          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 sm:w-auto"
          >
            組織を削除する
          </button>
        )}
      </section>

      {canDeleteOrganization && isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-base font-bold text-slate-900">
              組織を削除しますか？
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              この操作を行うと、この組織に登録された会社・業者情報、社員、取引先、外注先、現場、予定などのデータが削除されます。
            </p>

            <p className="mt-2 text-sm font-semibold text-rose-700">
              この操作は元に戻せません。
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-56"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleDeleteOrganization}
                disabled={isDeleting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 sm:w-56"
              >
                {isDeleting ? "削除しています..." : "組織を削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
