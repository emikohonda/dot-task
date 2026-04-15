// apps/web/src/app/schedules/today/_components/TodayPageContent.tsx
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import TodayScheduleCard from "./TodayScheduleCard";
import { FloatingAddButton } from "@/components/FloatingAddButton";

const API_BASE =
    process.env.API_BASE_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
    "http://127.0.0.1:3001";

// --------------------------------
// 型定義（TodayScheduleCard からも import される）
// --------------------------------
export type Employee = { employee: { id: string; name: string } };
export type Contractor = { contractor: { id: string; name: string } };

export type Schedule = {
    id: string;
    title: string;
    date: string;
    status: "TODO" | "DOING" | "HOLD" | "DONE" | "CANCELLED";
    startTime: string | null;
    endTime: string | null;
    description: string | null;
    site: { id: string; name: string } | null;
    employees?: Employee[];
    contractors?: Contractor[];
};

type SiteGroup = {
    siteId: string;
    siteName: string;
    schedules: Schedule[];
};

// --------------------------------
// ユーティリティ
// --------------------------------
function getTodayYmd(): string {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = jst.getUTCFullYear();
    const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(jst.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatTodayHeading(ymd: string): string {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    return `${y}年${m}月${d}日（${dayNames[date.getDay()]}）`;
}

function groupBySite(schedules: Schedule[]): SiteGroup[] {
    const map = new Map<string, SiteGroup>();
    for (const s of schedules) {
        const siteId = s.site?.id ?? "__no_site__";
        const siteName = s.site?.name ?? "（現場未設定）";
        if (!map.has(siteId)) map.set(siteId, { siteId, siteName, schedules: [] });
        map.get(siteId)!.schedules.push(s);
    }
    return Array.from(map.values());
}

// --------------------------------
// データ取得
// --------------------------------
async function fetchTodaySchedules(date: string): Promise<Schedule[]> {
    try {
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

// --------------------------------
// 共通コンポーネント本体
// --------------------------------
export default async function TodayPageContent() {
    const today = getTodayYmd();
    const schedules = await fetchTodaySchedules(today);
    const groups = groupBySite(schedules);

    const totalSchedules = schedules.length;
    const totalSites = groups.length;
    const totalEmployees = new Set(
        schedules.flatMap((s) => (s.employees ?? []).map((e) => e.employee.id))
    ).size;

    return (
        <div className="space-y-6">
            <PageHeader
                title={formatTodayHeading(today)}
                align="center"
            />

            {/* サマリー */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "本日の予定", value: `${totalSchedules}件` },
                    { label: "現場数", value: `${totalSites}件` },
                    { label: "参加社員", value: `${totalEmployees}名` },
                ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {groups.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-white py-16 text-center">
                    <p className="text-sm text-slate-500">本日の予定はありません</p>
                    <p className="mt-1 text-xs text-slate-400">必要なら新しい予定を追加してください</p>
                    <Link
                        href={`/schedules/new?date=${today}`}
                        className="mt-4 inline-block rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                    >
                        予定を追加する
                    </Link>
                </div>
            )}

            {/* 現場ごとグルーピング */}
            {groups.map((group) => (
                <section key={group.siteId}>
                    <div className="mb-3 flex items-center gap-2">
                        <span className="h-4 w-1 rounded-full bg-sky-500" />
                        <h2 className="text-sm font-bold text-slate-700">{group.siteName}</h2>
                        <span className="text-xs text-slate-400">{group.schedules.length}件</span>
                    </div>
                    <div className="space-y-3">
                        {group.schedules.map((schedule) => (
                            <TodayScheduleCard key={schedule.id} schedule={schedule} />
                        ))}
                    </div>
                </section>
            ))}

            {/* スマホ用FAB */}
            <FloatingAddButton href={`/schedules/new?date=${today}`} />
        </div>
    );
}