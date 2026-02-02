// apps/web/src/app/schedules/SchedulesClient.tsx
// 予定一覧「全現場の予定」ページ
"use client";

import Link from "next/link";
import * as React from "react";
import { patchScheduleStatus } from "@/lib/schedulesApi";
import { STATUS_META, SCHEDULE_STATUS, type ScheduleStatus } from "@/lib/scheduleStatus";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

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

type Schedule = {
    id: string;
    title: string;
    date: string | null;
    status: ScheduleStatus;
    site?: { name?: string | null } | null;
    contractor?: { name?: string | null } | null;
};

export default function SchedulesClient({
    initialSchedules,
}: {
    initialSchedules: Schedule[];
}) {
    const [schedules, setSchedules] = React.useState<Schedule[]>(initialSchedules);
    const [savingId, setSavingId] = React.useState<string | null>(null);

    const hasAny = schedules.length > 0;
    const allCancelled = hasAny && schedules.every((s) => s.status === "CANCELLED");

    const updateLocal = (id: string, patch: Partial<Schedule>) => {
        setSchedules((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
        );
    };

    const onChangeStatus = async (id: string, next: ScheduleStatus) => {
        const current = schedules.find((s) => s.id === id)?.status;
        if (!current || current === next) return;

        // 1) 即反映（楽観更新）
        updateLocal(id, { status: next });

        // 2) PATCH
        setSavingId(id);
        try {
            await patchScheduleStatus(id, next);
        } catch (e) {
            // 3) 失敗したら元に戻す
            updateLocal(id, { status: current });
            alert("更新に失敗しました。通信状態を確認してもう一度お試しください。");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* タイトル */}
            <PageHeader
                eyebrow="予定一覧"
                title="全現場の予定"
                right={
                    <Link
                        href="/schedules/new"
                        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                    >
                        ＋ 予定を追加
                    </Link>
                }
            />

            {/* 全部中止メッセージ（③） */}
            {allCancelled && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    いま表示されている予定はすべて「中止」です。記録として残しつつ、状態がわかるようにしています。
                </div>
            )}

            {/* 一覧 */}
            <CardSection title="スケジュール">
                {!hasAny ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <p className="text-sm font-medium text-slate-900">
                            予定はまだありません
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            右上の「＋ 予定を追加」から登録できます。
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {schedules.map((s) => {
                            const meta = STATUS_META[s.status];
                            const cancelled = !!meta.isCancelled;

                            return (
                                <li
                                    key={s.id}
                                    className={[
                                        "group py-3 transition-all duration-500", // transitionを追加してフェードさせる
                                        cancelled ? "opacity-60" : "opacity-100", // 中止時はより薄く
                                    ].join(" ")}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <Link
                                                href={`/schedules/${s.id}/edit`}
                                                className="group mb-2 inline-flex items-center gap-1 truncate font-medium text-slate-900 transition-colors hover:text-sky-600"
                                            >
                                                <span className={[
                                                    "truncate font-semibold text-[17px] leading-tight",
                                                    cancelled ? "text-slate-500" : ""
                                                ].join(" ")}>
                                                    {s.title}
                                                </span>
                                                <span className="text-[11px] opacity-0 transition group-hover:opacity-60">
                                                    （編集）
                                                </span>
                                            </Link>

                                            <p className={[
                                                "text-[13px] text-slate-600",
                                                cancelled ? "line-through opacity-70" : ""
                                            ].join(" ")}>
                                                日時：{formatDateTime(s.date)}
                                            </p>

                                            {s.site?.name && (
                                                <p className="mt-0.5 text-[13px] text-slate-600">
                                                    現場：{s.site.name}
                                                </p>
                                            )}

                                            {s.contractor?.name && (
                                                <p className="mt-0.5 text-[13px] text-slate-600">
                                                    協力会社：{s.contractor.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* ✅ バッジ：meta.className を使って一元管理 */}
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}
                                            >
                                                {meta.label}
                                            </span>

                                            {/* select（shadcn未導入なら素のselectでOK） */}
                                            <select
                                                value={s.status}
                                                onChange={(e) =>
                                                    onChangeStatus(s.id, e.target.value as ScheduleStatus)
                                                }
                                                disabled={savingId === s.id}
                                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                                            >
                                                {SCHEDULE_STATUS.map((st) => (
                                                    <option key={st} value={st}>
                                                        {STATUS_META[st].label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* 更新中表示（任意だけどわかりやすい） */}
                                            {savingId === s.id && (
                                                <span className="text-xs text-slate-500">更新中…</span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardSection>
        </div>
    );
}