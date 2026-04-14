// apps/web/src/components/MobileShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { BottomNav } from "./BottomNav";

const menuItems = [
  { href: "/schedules",   label: "予定一覧" },
  { href: "/companies",   label: "取引先" },
  { href: "/contractors", label: "外注先" },
];

export function MobileShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // ページ遷移で閉じる
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
          // bottom は BottomNav の高さ（56px） + safe-area
          "bottom-[calc(64px+env(safe-area-inset-bottom))]",
          menuOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-3 opacity-0 pointer-events-none"
        )}
      >
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
      </div>

      {/* 下ナビ本体 */}
      <BottomNav
        onMenuClick={() => setMenuOpen((prev) => !prev)}
        menuOpen={menuOpen}
      />
    </>
  );
}
