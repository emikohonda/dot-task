// apps/web/src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, CalendarDays, MapPin, Menu } from "lucide-react";

type Props = {
  onMenuClick: () => void;
  menuOpen: boolean;
};

// メニューアイコンをアクティブにするパス
const MENU_PATHS = ["/schedules", "/companies", "/contractors"];

export function BottomNav({ onMenuClick, menuOpen }: Props) {
  const pathname = usePathname();

  const isMenuActive =
    menuOpen || MENU_PATHS.some((p) => pathname.startsWith(p));

  const linkItems = [
    {
      href: "/",
      label: "ホーム",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: "/calendar",
      label: "カレンダー",
      icon: CalendarDays,
      isActive: pathname.startsWith("/calendar"),
    },
    {
      href: "/sites",
      label: "現場",
      icon: MapPin,
      isActive: pathname.startsWith("/sites"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around">

        {/* リンク3項目（ホーム / カレンダー / 現場） */}
        {linkItems.map(({ href, label, icon: Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-[56px]",
              isActive ? "text-sky-600" : "text-slate-500"
            )}
          >
            <Icon
              className={clsx(
                "h-5 w-5",
                isActive ? "text-sky-600" : "text-slate-400"
              )}
            />
            <span
              className={clsx(
                "text-[10px] font-medium",
                isActive ? "text-sky-600" : "text-slate-500"
              )}
            >
              {label}
            </span>
          </Link>
        ))}

        {/* メニュートリガー */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          className={clsx(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-[56px]",
            isMenuActive ? "text-sky-600" : "text-slate-500"
          )}
        >
          <Menu
            className={clsx(
              "h-5 w-5",
              isMenuActive ? "text-sky-600" : "text-slate-400"
            )}
          />
          <span
            className={clsx(
              "text-[10px] font-medium",
              isMenuActive ? "text-sky-600" : "text-slate-500"
            )}
          >
            メニュー
          </span>
        </button>

      </div>
    </nav>
  );
}