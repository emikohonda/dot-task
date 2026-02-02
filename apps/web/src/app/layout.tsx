//apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";

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
      <body className="bg-slate-50 text-slate-900">
        {/* 固定ヘッダー */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            {/* ロゴ部分 */}
            <Link
              href="/"
              className="text-3xl font-extrabold tracking-tight text-sky-600"
            >
              .TASK
            </Link>

            {/* ナビゲーション */}
            <HeaderNav />
          </div>
        </header>
        {/* メイン */}
        <main className="mx-auto max-w-5xl px-6 pt-6 pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
