// apps/web/src/app/setup/organization/AccountActionsToggle.tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { clearCalendarScheduleCache } from "@/lib/calendarCache";

import { AccountDeleteSection } from "./AccountDeleteSection";
import { signOutCurrentUser } from "./actions";

export function AccountActionsToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) return;

    setIsSigningOut(true);

    clearCalendarScheduleCache();
    await signOutCurrentUser();
  }

  return (
    <>
      <div className="pt-4">
        <div className="space-y-2">
          <p className="px-1 text-sm font-medium text-slate-500">
            その他の操作はこちら
          </p>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="account-actions-panel"
            className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <span>ログアウト / アカウント削除</span>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {isOpen && (
          <div id="account-actions-panel" className="mt-3 space-y-3">
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ログアウト
            </button>

            <AccountDeleteSection />
          </div>
        )}
      </div>

      {isLogoutDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-base font-bold text-slate-900">
              ログアウトしますか？
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              現在のアカウントからログアウトします。
              <br />
              よろしいですか？
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsLogoutDialogOpen(false)}
                disabled={isSigningOut}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-56"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300 sm:w-56"
              >
                {isSigningOut ? "ログアウトしています..." : "ログアウトする"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
