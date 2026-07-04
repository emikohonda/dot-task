// apps/web/src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { CalendarDays, MapPin, Menu, Sun } from "lucide-react";

type Props = {
  onMenuClick: () => void;
  menuOpen: boolean;
};

const MENU_PATHS = [
  "/schedules",
  "/employees",
  "/companies",
  "/contractors",
  "/settings",
];

export function BottomNav({ onMenuClick, menuOpen }: Props) {
  const pathname = usePathname();

  const isTodayActive = pathname.startsWith("/schedules/today");
  const isMenuPath = MENU_PATHS.some((p) => pathname.startsWith(p));

  const isMenuActive = menuOpen || (isMenuPath && !isTodayActive);

  const linkItems = [
    {
      href: "/calendar",
      label: "カレンダー",
      icon: CalendarDays,
      isActive: pathname.startsWith("/calendar"),
    },
    {
      href: "/schedules/today",
      label: "今日",
      icon: Sun,
      isActive: isTodayActive,
    },
    {
      href: "/sites",
      label: "現場",
      icon: MapPin,
      isActive: pathname.startsWith("/sites"),
    },
  ];

  const itemClass =
    "flex flex-1 flex-col items-center justify-start gap-1 pt-2.5 pb-1 min-h-[64px] transition-colors";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
      }}
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
                "text-[11px] font-medium leading-none",
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
              "text-[11px] font-medium leading-none",
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
