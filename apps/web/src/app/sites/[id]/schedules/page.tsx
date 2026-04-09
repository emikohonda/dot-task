// apps/web/src/app/sites/[id]/schedules/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSite, fetchSiteSchedules } from "@/lib/fetchers/sites";

// ── ユーティリティ ──

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatScheduleDateTime(
  dateStr: string | null,
  startTime?: string | null,
  endTime?: string | null
) {
  if (!dateStr) return "-";
  const dateLabel = formatDate(dateStr);
  if (startTime && endTime) return `${dateLabel} ${startTime}〜${endTime}`;
  if (startTime) return `${dateLabel} ${startTime}`;
  return `${dateLabel} 終日`;
}

// ── ページ ──

export default async function SiteSchedulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const site = await fetchSite(id);
  if (!site) notFound();

  const { items: schedules, total: scheduleTotal } = await fetchSiteSchedules(id, 100, { includeCompleted: true });

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/sites/${id}`}
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          ◀︎ 現場詳細に戻る
        </Link>
        <Link
          href="/sites"
          className="text-sm font-medium text-sky-700 hover:underline"
        >
          現場一覧へ ▶︎
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs text-slate-500">予定一覧</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">
          {site.name} の予定
        </h1>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          スケジュール（{scheduleTotal}件）
        </h2>

        {schedules.length === 0 ? (
          <p className="text-sm text-slate-500">予定はまだありません。</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {schedules.map((s) => {
              const contractorNames =
                s.contractors
                  ?.map((x) => x.contractor?.name ?? null)
                  .filter((n): n is string => Boolean(n && n.trim())) ?? [];

              return (
                <li key={s.id} className="py-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {s.title?.trim() ? s.title : "作業内容 未入力"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatScheduleDateTime(s.date, s.startTime, s.endTime)}
                      {contractorNames.length > 0 && ` / ${contractorNames.join(" / ")}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}