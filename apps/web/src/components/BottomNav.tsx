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

  const itemClass =
    "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[64px] transition-colors";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around">
        {linkItems.map(({ href, label, icon: Icon, isActive }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              itemClass,
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
                "text-[11px] font-medium",
                isActive ? "text-sky-600" : "text-slate-500"
              )}
            >
              {label}
            </span>
          </Link>
        ))}

        <button
          type="button"
          onClick={onMenuClick}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          className={clsx(
            itemClass,
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
              "text-[11px] font-medium",
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