// apps/web/src/app/schedules/new/page.tsx
import Link from "next/link";
import { fetchSites } from "@/lib/fetchers/sites";
import { Suspense } from "react";
import ScheduleForm from "../_components/ScheduleForm";

export default async function NewSchedulePage() {
  const sites = await fetchSites(200);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      {/* ヘッダー */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">予定追加</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              新しい予定
            </h1>
          </div>

          <Link
            href="/schedules"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            一覧へ戻る
          </Link>
        </div>
      </section>

      {/* フォーム */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Suspense
          fallback={
            <div className="py-8 text-center text-sm text-slate-500">
              フォームを準備中…
            </div>
          }
        >
          <ScheduleForm mode="create" sites={sites} />
        </Suspense>
      </section>
    </main>
  );
}