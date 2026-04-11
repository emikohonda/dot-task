// apps/web/src/app/page.tsx
import Link from "next/link";
import { fetchSites } from "@/lib/api";

export const dynamic = "force-dynamic";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type Site = {
  id: string;
  name: string;
  companyName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
};

type Employee = { employee: { id: string; name: string } };
type Contractor = { contractor: { id: string; name: string } };
type Schedule = {
  id: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  site: { id: string; name: string } | null;
  employees?: Employee[];
  contractors?: Contractor[];
};

function getTodayYmd(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatToday() {
  const today = new Date();
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(today);
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatEmployeePreview(employees: Employee[]) {
  const names = employees.map((e) => e.employee.name).filter(Boolean);
  if (names.length === 0) return "未設定";
  if (names.length <= 2) return names.join("、");
  return `${names.slice(0, 2).join("、")}、他${names.length - 2}名`;
}

async function fetchTodaySchedules(): Promise<Schedule[]> {
  try {
    const date = getTodayYmd();
    const res = await fetch(`${API_BASE}/schedules?date=${date}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const todayLabel = formatToday();

  let sites: Site[] = [];
  try {
    sites = await fetchSites();
  } catch {
    sites = [];
  }

  const schedules = await fetchTodaySchedules();
  const previewSites = sites.slice(0, 3);

  // サマリー集計
  const totalSchedules = schedules.length;
  const totalSites = new Set(schedules.map((s) => s.site?.id).filter(Boolean)).size;
  const totalEmployees = new Set(
    schedules.flatMap((s) => (s.employees ?? []).map((e) => e.employee.id))
  ).size;

  return (
    <div className="space-y-6">
      {/* 朝礼DX：今日の流れ */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">今日の流れ</h2>
            <span className="text-xs text-slate-500">{todayLabel}</span>
          </div>
          <Link
            href="/schedules/today"
            className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
          >
            今日の予定を見る
          </Link>
        </div>

        {totalSchedules === 0 ? (
          <>
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              今日は予定が空いてます。現場の流れを整えるチャンス！
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/schedules/new"
                className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100"
              >
                ＋ 予定を追加
              </Link>
              <Link
                href="/schedules"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                予定一覧
              </Link>
              <Link
                href="/calendar"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                カレンダー
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* サマリー */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { label: "本日の予定", value: `${totalSchedules}件` },
                { label: "現場数", value: `${totalSites}件` },
                { label: "参加社員", value: `${totalEmployees}名` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            {/* 予定プレビュー（最大3件） */}
            <div className="space-y-2">
              {schedules.slice(0, 3).map((s) => {
                const isTimed = !!s.startTime;
                const rowStyles = isTimed
                  ? "border-sky-100 bg-sky-50/60 hover:bg-sky-50/70 hover:border-sky-300"
                  : "border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200";

                // 社員名：2名まで表示、残りは「ほかN名」


                return (
                  <Link
                    key={s.id}
                    href={`/schedules/${s.id}`}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition hover:shadow-sm ${rowStyles}`}
                  >
                    {/* 左：2段情報 */}
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 text-[10px] font-mono font-bold ${isTimed ? "text-sky-700" : "text-slate-400"}`}>
                          {isTimed ? `${s.startTime}〜${s.endTime}` : "終日"}
                        </span>
                        <span className="truncate text-sm font-bold text-slate-800">
                          {s.site?.name ?? "（現場未設定）"}
                          {s.title && <span className="ml-1 font-normal text-slate-500">/ {s.title}</span>}
                        </span>
                      </div>
                      <div className="truncate text-[11px] text-slate-500">
                        {formatEmployeePreview(s.employees ?? [])}
                      </div>
                    </div>
                    {/* 右：矢印 */}
                    <div className="ml-3 flex shrink-0 items-center">
                      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
              {totalSchedules > 3 && (
                <p className="text-right text-xs text-slate-400">他 {totalSchedules - 3}件…</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* 現場カード（３件プレビュー） */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">現場</h3>
            <p className="text-sm text-slate-500">いま動いている現場を、ひと目で確認。</p>
          </div>
          <Link
            href="/sites"
            className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100"
          >
            現場一覧へ
          </Link>
        </div>

        <div className="mt-4">
          {sites.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              現場を登録すると、"流れ"が作れるよ
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {previewSites.map((site) => (
                <Link
                  key={site.id}
                  href={`/sites/${site.id}`}
                  className="group rounded-xl border border-slate-200 bg-slate-100/70 p-4 transition hover:bg-slate-50 hover:border-sky-200"
                >
                  <div className="mb-1 text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                    {site.name}
                  </div>
                  <div className="text-xs text-slate-500">元請：{site.companyName ?? "-"}</div>
                  <div className="mt-2 text-xs text-slate-600">
                    期間：{formatDate(site.startDate)} ～ {formatDate(site.endDate)}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    作成：{formatDate(site.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 下のカード 取引先 / 外注先 / 請求書 / 領収書 */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-slate-900">取引先</h3>
          <p className="mb-4 text-sm text-slate-500">元請会社の登録・編集</p>
          <Link href="/companies" className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100">
            取引先を管理
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-slate-900">外注先</h3>
          <p className="mb-4 text-sm text-slate-500">外注先の登録・管理</p>
          <Link href="/contractors" className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100">
            外注先を管理
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-slate-900">請求書</h3>
          <p className="mb-4 text-sm text-slate-500">請求書の作成・管理</p>
          <Link href="/invoices" className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100">
            請求書を管理
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xl font-semibold text-slate-900">領収書</h3>
          <p className="mb-4 text-sm text-slate-500">領収書の作成・管理</p>
          <Link href="/receipts" className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100">
            領収書を管理
          </Link>
        </div>
      </section>
    </div>
  );
}
