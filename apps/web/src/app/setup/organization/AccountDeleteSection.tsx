// apps/web/src/app/setup/organization/AccountDeleteSection.tsx
"use client";

import { useState } from "react";

import { clearCalendarScheduleCache } from "@/lib/calendarCache";

import { signOutAfterAccountDeletion } from "./actions";

type DeleteErrorResponse = {
  errorCode?: string;
  message?: string;
};

export function AccountDeleteSection() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
      });

      const data = (await res.json().catch(() => null)) as
        | DeleteErrorResponse
        | null;

      const isAlreadyDeleted =
        res.status === 404 && data?.message === "User not found";

      // 200: 削除成功
      // 404 + User not found: DB上では既に削除済み
      if (res.ok || isAlreadyDeleted) {
        clearCalendarScheduleCache();
      } else if (data?.errorCode === "USER_HAS_ORGANIZATION_MEMBERSHIP") {
        throw new Error(
          "組織に所属している間はアカウントを削除できません。",
        );
      } else {
        throw new Error(
          data?.message ?? "アカウントを削除できませんでした",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "アカウントを削除できませんでした",
      );
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      return;
    }

    // ここに到達するのは「削除成功」または「既に削除済み」の場合だけ。
    // DELETE成功後のsignOutは削除エラーとは別に扱う。
    // User削除後のsignOut失敗を「アカウント削除失敗」と誤表示しないため、
    // DELETE用のtry/catchの外で呼ぶ。
    await signOutAfterAccountDeletion();
  }

  return (
    <>
      <section className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div>
          <h2 className="text-base font-bold text-rose-700">
            アカウント削除
          </h2>

          <p className="mt-1 text-sm leading-6 text-rose-700">
            .TASKを今後利用しない場合は、個人アカウントを削除できます。
            この操作は元に戻せません。
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 sm:w-auto"
        >
          アカウントを削除する
        </button>
      </section>

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-base font-bold text-slate-900">
              アカウントを削除しますか？
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              個人アカウントを削除すると、このアカウントでは.TASKを利用できなくなります。
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
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 sm:w-56"
              >
                {isDeleting
                  ? "削除しています..."
                  : "アカウントを削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
