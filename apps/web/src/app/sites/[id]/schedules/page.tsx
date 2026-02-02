import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSites } from "@/lib/api";
import { fetchSiteSchedules } from "@/lib/fetchers/sites";
import { getStatusMeta } from "@/lib/status";

function formatDateTime(dateStr: string | null) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function Card({
    title,
    children,
}: {
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {title && (
                <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
            )}
            {children}
        </section>
    );
}

export default async function SiteSchedulesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    //現場名を出したいので現場を取得（今の構成に合わせて fetchSites→find）
    const sites = await fetchSites();
    const site = sites.find((s) => s.id === id);
    if (!site) return notFound();

    //一覧はとりあえず100件
    const schedules = await fetchSiteSchedules(id, 100);

    return (
        <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
            {/*　戻る */}
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

            {/* タイトル */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs text-slate-500">予定一覧</p>
                <h1 className="mt-1 text-xl font-bold text-slate-900">
                    {site.name} の予定
                </h1>
            </section>

            {/* 一覧 */}
            <Card title="スケジュール">
                {schedules.length === 0 ? (
                    <p className="text-sm text-slate-500">予定はまだありません。</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {schedules.map((s) => (
                            <li key={s.id} className="py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-slate-900">{s.title}</p>
                                        <p className="text-sm text-slate-600">
                                            {formatDateTime(s.date)}
                                            {s.contractor?.name ? ` / ${s.contractor.name}` : ""}
                                        </p>
                                    </div>

                                    {(() => {
                                        const meta = getStatusMeta(s.status);
                                        if (!meta) return null;

                                        return (
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}
                                            >
                                                {meta.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </main>
    );
}