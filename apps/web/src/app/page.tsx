//apps/web/src/app/page.tsx
import Link from "next/link";
import { fetchSites } from "@/lib/api";

type Site = {
  id: string;
  name: string;
  companyName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
};

function formatToday() {
  const today = new Date();
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(today);
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

export default async function HomePage() {
  const todayLabel = formatToday();

  // ✅ API が死んでてもトップを落とさない
  let sites: Site[] = [];
  try {
    sites = await fetchSites();
  } catch (e) {
    // 本番でAPI未接続の間はここに落ちるのが正常
    sites = [];
  }

  const previewSites = sites.slice(0, 3);

  return (
    <>    
      {/* メイン */}
      <div className="space-y-6">
        {/* 今日の流れ（旧：本日の予定カード） */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">
              今日の流れ
            </h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs text-slate-600">
              {todayLabel}
            </span>
          </div>

          <p className="mb-4 text-sm text-slate-500">
            止まっているなら、”理由”を見える化しよう。
          </p>

          <div className="mb-4 text-3xl font-bold leading-none text-slate-900">
            0
            <span className="ml-1 text-base font-normal text-slate-500">
              件
            </span>
          </div>

          {/* 空状態（今は０件固定なのでメッセージを出しておく） */}
          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            今日は予定が空いてます。現場の流れを整えるチャンス！
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/schedules"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              予定一覧
            </Link>
            <Link
              href="/calendar"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              カレンダー
            </Link>
            <Link
              href="/sites"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              現場を見る
            </Link>
          </div>
        </section>

        {/* 追加：現場カード（３件プレビュー） */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-1 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">現場</h3>
              <p className="text-sm text-slate-500">
                いま動いている現場を、ひと目で確認。
              </p>
            </div>

            <Link
              href="/sites"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              現場一覧へ
            </Link>
          </div>

          <div className="mt-4">
            {sites.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                現場を登録すると、“流れ”が作れるよ
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {previewSites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/sites/${site.id}`}
                    className="group rounded-xl border border-slate-100 bg-white p-4 hover:bg-slate-50"
                    title="現場詳細へ"
                  >
                    <div className="mb-1 text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                      {site.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      元請：{site.companyName ?? '-'}
                    </div>
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
          {/* 取引先カード */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-semibold text-slate-900">取引先</h3>
            <p className="mb-4 text-sm text-slate-500">元請会社の登録・編集</p>
            <Link
              href="/companies"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              取引先を管理
            </Link>
          </div>

          {/* 外注先カード */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-semibold text-slate-900">外注先</h3>
            <p className="mb-4 text-sm text-slate-500">外注先の登録・管理</p>
            <Link
              href="/contractors"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              外注先を管理
            </Link>
          </div>

          {/* 請求書カード */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-semibold text-slate-900">請求書</h3>
            <p className="mb-4 text-sm text-slate-500">請求書の作成・管理</p>
            <Link
              href="/invoices"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              請求書を管理
            </Link>
          </div>

          {/* 領収書カード */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-xl font-semibold text-slate-900">領収書</h3>
            <p className="mb-4 text-sm text-slate-500">領収書の作成・管理</p>
            <Link
              href="/receipts"
              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
            >
              領収書を管理
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}