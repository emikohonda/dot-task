// apps/web/src/components/MobileShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LogOut, Settings, Smartphone, X } from "lucide-react";
import { BottomNav } from "./BottomNav";

const menuItems = [
  { href: "/schedules", label: "予定一覧" },
  { href: "/employees", label: "社員一覧" },
  { href: "/companies", label: "取引先" },
  { href: "/contractors", label: "外注先" },
];

type OrganizationMe = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

export function MobileShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [organization, setOrganization] = useState<OrganizationMe | null>(null);
  const pathname = usePathname();

  const fetchOrganizationMe = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/me", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = (await res.json()) as OrganizationMe;
      setOrganization(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  // ホーム画面からPWAとして起動しているか判定
  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;

    setIsStandalone(standalone);
  }, []);

  // ページ遷移で閉じる
  useEffect(() => {
    setMenuOpen(false);
    setInstallGuideOpen(false);
  }, [pathname]);

  // メニューを開いた時にログイン中ユーザー情報を取得
  useEffect(() => {
    if (!menuOpen) return;
    if (organization) return;

    fetchOrganizationMe();
  }, [menuOpen, organization, fetchOrganizationMe]);

  // 自社設定更新後にアカウント情報を再取得
  useEffect(() => {
    const handleOrganizationUpdated = () => {
      fetchOrganizationMe();
    };

    window.addEventListener("organization-updated", handleOrganizationUpdated);

    return () => {
      window.removeEventListener(
        "organization-updated",
        handleOrganizationUpdated,
      );
    };
  }, [fetchOrganizationMe]);

  // メニューオープン中は後ろのページをスクロール禁止
  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";

      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  return (
    <>
      {/* バックドロップ */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {installGuideOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 md:hidden"
          onClick={() => setInstallGuideOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-sky-600">
                  ホーム画面に追加
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  .TASKをアプリのように使えます
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setInstallGuideOpen(false)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm leading-6 text-slate-600">
              ホーム画面に追加すると、次回からアイコンをタップするだけで
              .TASKを開けます。
            </p>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">
                  iPhone Safari の場合
                </h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 leading-6">
                  <li>Safariでこの画面を開きます</li>
                  <li>画面下の共有ボタンを押します</li>
                  <li>「ホーム画面に追加」を選びます</li>
                  <li>右上の「追加」を押します</li>
                </ol>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">
                  iPhone Chrome の場合
                </h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 leading-6">
                  <li>Chromeでこの画面を開きます</li>
                  <li>共有ボタンを押します</li>
                  <li>「ホーム画面に追加」を選びます</li>
                  <li>右上の「追加」を押します</li>
                </ol>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  表示されない場合は、Safariで開いて追加してください。
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">
                  Android Chrome の場合
                </h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 leading-6">
                  <li>Chromeでこの画面を開きます</li>
                  <li>右上のメニューを押します</li>
                  <li>「ホーム画面に追加」または「アプリをインストール」を選びます</li>
                  <li>画面の案内に沿って追加します</li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInstallGuideOpen(false)}
              className="mt-5 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* メニューパネル（下ナビの上に出る） */}
      <div
        className={clsx(
          "fixed left-4 right-4 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200 md:hidden",
          "bottom-[calc(85px+env(safe-area-inset-bottom))]",
          menuOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-3 opacity-0 pointer-events-none"
        )}
      >
        <div className="max-h-[70vh] overflow-y-auto py-2">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-xs font-semibold text-slate-400">アカウント</p>

            {organization ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {organization.user.name ?? "ログイン中ユーザー"}
                </p>
                <p className="break-all text-xs text-slate-500">
                  {organization.user.email}
                </p>
                <p className="text-xs text-slate-500">
                  {organization.name}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                アカウント情報を取得中...
              </p>
            )}
          </div>

          <div className="py-2">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block px-5 py-3.5 text-sm font-medium transition-colors hover:bg-slate-50",
                    isActive ? "font-semibold text-sky-600" : "text-slate-700"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-100 py-2">
            <p className="px-5 pb-1 pt-2 text-xs font-semibold text-slate-400">
              設定
            </p>

            <Link
              href="/settings/organization"
              className={clsx(
                "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-slate-50",
                pathname.startsWith("/settings/organization")
                  ? "font-semibold text-sky-600"
                  : "text-slate-700"
              )}
            >
              <Settings className="h-4 w-4" />
              アカウント設定
            </Link>

            {!isStandalone && (
              <button
                type="button"
                onClick={() => setInstallGuideOpen(true)}
                className="flex w-full items-center gap-2 px-5 py-3.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Smartphone className="h-4 w-4" />
                ホーム画面に追加
              </button>
            )}

            <Link
              href="/logout"
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </Link>
          </div>
        </div>
      </div>

      {/* 下ナビ本体 */}
      <BottomNav
        onMenuClick={() => setMenuOpen((prev) => !prev)}
        menuOpen={menuOpen}
      />
    </>
  );
}