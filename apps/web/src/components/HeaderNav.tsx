// apps/web/src/components/HeaderNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/",            label: "ホーム" },
  { href: "/calendar",    label: "カレンダー" },
  { href: "/schedules",   label: "予定一覧" },
  { href: "/sites",       label: "現場一覧" },
  { href: "/employees",   label: "社員名簿" },
  { href: "/companies",   label: "取引先" },
  { href: "/contractors", label: "外注先" },
];

// デスクトップ専用ナビ（md以上のみ表示）
export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex gap-6 text-sm">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "transition-colors",
              isActive
                ? "font-semibold text-sky-600"
                : "text-slate-700 hover:text-sky-600"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
