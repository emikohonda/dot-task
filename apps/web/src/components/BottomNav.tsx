// apps/web/src/components/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Home, Sun, CalendarDays, MapPin, Plus } from "lucide-react";

const bottomNavItems = [
  { href: "/",                label: "ホーム",  icon: Home         },
  { href: "/schedules/today", label: "今日",    icon: Sun          },
  { href: "/schedules/new",   label: "追加",    icon: Plus,  isAdd: true },
  { href: "/schedules",       label: "予定",    icon: CalendarDays },
  { href: "/sites",           label: "現場",    icon: MapPin       },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around px-2 py-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/schedules"
              ? (
                  pathname === "/schedules" ||
                  (pathname.startsWith("/schedules/") &&
                    !pathname.startsWith("/schedules/today") &&
                    !pathname.startsWith("/schedules/new"))
                )
              : pathname.startsWith(item.href);

          if (item.isAdd) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-[56px] flex-col items-center justify-center gap-0.5 py-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 shadow-md active:bg-sky-700">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-medium text-sky-600">追加</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-0.5 py-1 transition-colors",
                isActive ? "text-sky-600" : "text-slate-500"
              )}
            >
              <Icon className={clsx("h-6 w-6", isActive ? "text-sky-600" : "text-slate-400")} />
              <span className={clsx(
                "text-[10px] font-medium",
                isActive ? "text-sky-600" : "text-slate-500"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
