// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import { MobileShell } from "@/components/MobileShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: ".TASK（ドットタスク）",
  description: "仕事が自然に回る現場をつくる。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900`}>
        {/* 固定ヘッダー */}
        <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-14 max-w-5xl items-center px-4 py-3 md:px-6 md:py-4">

            {/* 左スペーサー（スマホのみ） */}
            <div className="flex-1 md:hidden" />

            {/* ロゴ：in-flow で中央に */}
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight text-sky-600 md:text-3xl"
            >
              .TASK
            </Link>

            {/* 右：デスクトップはナビ、スマホはスペーサー */}
            <div className="flex flex-1 justify-end">
              <HeaderNav />
            </div>

          </div>
        </header>

        {/* メイン */}
        <main className="mx-auto max-w-5xl px-4 pt-[calc(56px+1.25rem)] pb-24 md:px-6 md:pt-[calc(64px+1.5rem)] md:pb-8">
          {children}
        </main>

        {/* スマホ専用：下ナビ＋メニュー */}
        <MobileShell />
      </body>
    </html>
  );
}