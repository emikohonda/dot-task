// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { BottomNav } from "@/components/BottomNav";

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
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
            {/* ロゴ */}
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight text-sky-600 md:text-3xl"
            >
              .TASK
            </Link>

            {/* デスクトップ：通常ナビ */}
            <HeaderNav />

            {/* スマホ：ハンバーガーメニュー */}
            <HamburgerMenu />
          </div>
        </header>

        {/* メイン：スマホはボトムナビ分の余白を確保 */}
        <main className="mx-auto max-w-5xl px-4 pt-5 pb-24 md:px-6 md:pt-6 md:pb-8">
          {children}
        </main>

        {/* スマホ専用ボトムナビ */}
        <BottomNav />
      </body>
    </html>
  );
}
