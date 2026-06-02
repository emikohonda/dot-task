// apps/web/src/components/MobileShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LogOut, Settings } from "lucide-react";
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

  // ページ遷移で閉じる
  useEffect(() => {
    setMenuOpen(false);
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
              自社設定
            </Link>

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