import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSites } from "@/lib/api";
import { fetchSiteSchedules } from "@/lib/fetchers/sites";
import { getStatusMeta } from "@/lib/status";
import { CalendarX } from "lucide-react";

function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

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

function EmptySchedule() {
    return (
        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
            <CalendarX className="h-6 w-6" />
            <p className="text-sm">予定はまだありません。</p>
            <p className="text-xs">予定を追加すると、ここに表示されます。</p>
        </div>
    );
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

function InfoRow({
    label,
    value,
}: {
    label: string;
    value?: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-12 gap-3 py-2">
            <div className="col-span-4 text-sm text-slate-500">{label}</div>
            <div className="col-span-8 text-sm text-slate-900">
                {value ?? <span className="text-slate-400">—</span>}
            </div>
        </div>
    );
}

export default async function SiteDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const sites = await fetchSites();
    const site = sites.find((s) => s.id === id);

    if (!site) return notFound();

    const schedules = await fetchSiteSchedules(id, 3);

    return (
        <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
            {/* 戻る */}
            <div>
                <Link
                    href="/sites"
                    className="text-sm font-medium text-sky-700 hover:underline"
                >
                    ◀︎ 現場一覧に戻る
                </Link>
            </div>

            {/* タイトル帯（カード） */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs text-slate-500">現場詳細</p>
                <h1 className="mt-1 text-xl font-bold text-slate-900">{site.name}</h1>
            </section>

            {/* 基本情報（カード） */}
            <Card title="基本情報">
                <div className="divide-y divide-slate-100">
                    <InfoRow label="元請" value={site.companyName ?? "-"} />
                    <InfoRow label="住所" value={site.address ?? "-"} />
                    <InfoRow
                        label="期間"
                        value={
                            <>
                                {formatDate(site.startDate)} ～ {formatDate(site.endDate)}
                            </>
                        }
                    />
                    <InfoRow label="作成日" value={formatDate(site.createdAt)} />
                </div>
            </Card>

            <Card>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">
                        この現場の予定（最大３件）
                    </h2>

                    <Link
                        href={`/sites/${id}/schedules`}
                        className="text-xs font-medium text-sky-700 hover:underline"
                    >
                        すべて見る ▶︎
                    </Link>
                </div>

                {schedules.length === 0 ? (
                    <EmptySchedule />
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