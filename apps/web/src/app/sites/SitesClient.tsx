"use client";

import Link from "next/link";
import * as React from "react";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

type Site = {
    id: string;
    name: string;
    companyName?: string | null;
    address?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    createdAt?: string | null;
};

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function formatPeriod(start?: string | null, end?: string | null) {
    const s = formatDate(start);
    const e = formatDate(end);
    if (s === "-" && e === "-") return "-";
    return `${s} ～ ${e}`;
}



export default function SitesClient({ initialSites }: { initialSites: Site[] }) {
    const [sites] = React.useState<Site[]>(initialSites);

    const hasAny = sites.length > 0;

    return (
        <div className="space-y-4">
            <PageHeader
                eyebrow="現場"
                title="現場一覧"
                right={
                    <Link
                        href="/sites/new"
                        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                    >
                        ＋ 現場を追加
                    </Link>
                }
            />

            <CardSection title="現場">
                {!hasAny ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-sm font-medium text-slate-900">まだ現場が登録されていません</p>
                        <p className="mt-1 text-sm text-slate-600">
                            右上の「＋ 現場を追加」から登録できます。
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {sites.map((site) => (
                            <li key={site.id} className="py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/sites/${site.id}`}
                                            className="group mb-2 inline-flex items-center gap-1 truncate font-medium text-slate-900 transition-colors hover:text-sky-600"
                                        >
                                            <span className="truncate font-semibold text-[17px] leading-tight">
                                                {site.name}
                                            </span>
                                            <span className="text-[11px] opacity-0 transition group-hover:opacity-60">
                                                （詳細）
                                            </span>
                                        </Link>

                                        <p className="text-[13px] text-slate-600">
                                            元請：{site.companyName ?? "-"}
                                        </p>

                                        <p className="text-[13px] text-slate-600">
                                            期間：{formatPeriod(site.startDate, site.endDate)}
                                        </p>

                                        <p className="text-[13px] text-slate-600">
                                            住所：{site.address ?? "-"}
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <div className="text-[11px] text-slate-500">作成日</div>
                                        <div className="text-xs text-slate-700">{formatDate(site.createdAt)}</div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardSection>
        </div>
    );
}