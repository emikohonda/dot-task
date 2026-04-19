// apps/web/src/app/sites/[id]/schedules/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSite, fetchSiteSchedules } from "@/lib/fetchers/sites";
import { formatScheduleTitle } from "@/lib/validations/scheduleSchemas";
import { ArrowUpDown } from "lucide-react";
import { FloatingAddButton } from "@/components/FloatingAddButton";

// ── ユーティリティ ──

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatScheduleDate(
  dateStr: string | null,
  startTime?: string | null,
  endTime?: string | null
) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const w = WEEKDAYS[d.getDay()];
  const dateLabel = `${y}年${m}月${day}日（${w}）`;
  if (startTime && endTime) return `${dateLabel} ${startTime}〜${endTime}`;
  if (startTime) return `${dateLabel} ${startTime}`;
  if (endTime) return `${dateLabel} ${endTime}`;
  return `${dateLabel} 終日`;
}

function safeTime(value?: string | null) {
  return value && /^\d{2}:\d{2}$/.test(value) ? value : "99:99";
}

// ── ページ ──

export default async function SiteSchedulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const tab = sp.tab === "done" ? "done" : "active";
  const sort = sp.sort === "desc" ? "desc" : "asc";

  const site = await fetchSite(id);
  if (!site) notFound();

  const { items: allSchedules } =
    await fetchSiteSchedules(id, 100, { includeCompleted: true });

  // 日付ベース暫定判定
  const today = new Date().toLocaleDateString("sv-SE");

  const filtered = allSchedules.filter((s) =>
    tab === "done"
      ? (s.date?.slice(0, 10) ?? "") < today
      : (s.date?.slice(0, 10) ?? "") >= today
  );

  const sorted = [...filtered].sort((a, b) => {
    const da = a.date ?? "";
    const db = b.date ?? "";
    if (da !== db) {
      return sort === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    }
    const ta = safeTime(a.startTime);
    const tb = safeTime(b.startTime);
    return sort === "asc" ? ta.localeCompare(tb) : tb.localeCompare(ta);
  });

  const tabHref = (t: "active" | "done") =>
    `/sites/${id}/schedules?tab=${t}&sort=${sort}`;
  const sortHref = `/sites/${id}/schedules?tab=${tab}&sort=${sort === "asc" ? "desc" : "asc"}`;

  return (
    <div className="space-y-4">
      {/* 戻るリンク */}
      <div className="space-y-2 px-1">
        <Link
          href={`/sites/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 詳細に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          {site.name}
        </h1>
      </div>

      {/* タブ＆ソート */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <Link
            href={tabHref("active")}
            className={[
              "flex min-h-[44px] items-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
              tab === "active"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            未完了
          </Link>
          <Link
            href={tabHref("done")}
            className={[
              "flex min-h-[44px] items-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
              tab === "done"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            完了済
          </Link>
        </div>

        <Link
          href={sortHref}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          <ArrowUpDown className="h-4 w-4 shrink-0" />
          {sort === "asc" ? "古い順" : "新しい順"}
        </Link>
      </div>

      {/* スケジュール一覧 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-sky-600" />
          <h2 className="text-lg font-bold text-slate-900">
            現場スケジュール（{sorted.length}件）
          </h2>
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">
            {tab === "done"
              ? "完了済の予定はありません。"
              : "未完了の予定はありません。"}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((s) => (
              <li key={s.id} className="py-3">
                <Link
                  href={`/schedules/${s.id}?back=/sites/${id}/schedules`}
                  className="group block rounded-xl transition-colors hover:bg-slate-50/60"
                >
                  <p
                    className={[
                      "text-base font-semibold group-hover:text-sky-600",
                      s.title?.trim() ? "text-slate-900" : "font-normal text-slate-400",
                    ].join(" ")}
                  >
                    {formatScheduleTitle(s.title)}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatScheduleDate(s.date, s.startTime, s.endTime)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FloatingAddButton
        href={`/schedules/new?siteId=${id}&back=${encodeURIComponent(`/sites/${id}/schedules`)}`}
      />
    </div>
  );
}