// apps/web/src/components/HamburgerMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

const menuItems = [
  { href: "/employees",   label: "社員名簿" },
  { href: "/companies",   label: "取引先" },
  { href: "/contractors", label: "外注先" },
  { href: "/calendar",    label: "カレンダー" },
];

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // 外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ページ遷移で閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-lg">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "block px-4 py-3 text-sm transition-colors hover:bg-slate-50",
                  isActive ? "font-semibold text-sky-600" : "text-slate-700"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
