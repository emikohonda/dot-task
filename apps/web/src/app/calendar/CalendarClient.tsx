// apps/web/src/app/calendar/CalendarClient.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Schedule } from "@/lib/fetchers/schedules";
import { STATUS_META } from "@/lib/scheduleStatus";
import { SiteCombobox } from "@/components/SiteCombobox";
import { ShareCurrentViewButton } from "@/components/ShareCurrentViewButton";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

type SiteOption = { id: string; name: string };

type Props = {
  initialSchedules: Schedule[];
  sites: SiteOption[];
  holidays?: Record<string, string>; // "YYYY-MM-DD": "祝日名"
};

function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0, 1);
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function formatMonthTitle(year: number, monthIndex0: number) {
  return `${year}年${monthIndex0 + 1}月`;
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function toDateTimeLocalFromYmd(ymd: string, hhmm = "09:00") {
  return `${ymd}T${hhmm}`;
}

function addMonths(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

export default function CalendarClient({ initialSchedules, sites, holidays }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- 現在時刻は固定 ---
  const nowRef = React.useRef(new Date());
  const now = nowRef.current;

  // --- URL → 初期年月（URL優先 / なければ今日） ---
  function getInitialYearMonth() {
    const y = Number(searchParams.get("y"));
    const m = Number(searchParams.get("m"));

    if (
      Number.isFinite(y) &&
      y > 2000 &&
      Number.isFinite(m) &&
      m >= 1 &&
      m <= 12
    ) {
      return { year: y, monthIndex0: m - 1 };
    }

    return {
      year: now.getFullYear(),
      monthIndex0: now.getMonth(),
    };
  }

  const initial = getInitialYearMonth();

  const [year, setYear] = React.useState(initial.year);
  const [monthIndex0, setMonthIndex0] = React.useState(initial.monthIndex0);
  const [selectedYmd, setSelectedYmd] = React.useState<string | null>(null);

  // --- URL変更（戻る・進む・直入力）に state を同期 ---
  React.useEffect(() => {
    const y = Number(searchParams.get("y"));
    const m = Number(searchParams.get("m"));

    // year（2000年以降のみ有効）
    if (Number.isFinite(y) && y > 2000) {
      setYear((prev) => (prev === y ? prev : y));
    }

    // month（1-12 → 0-11）
    if (Number.isFinite(m) && m >= 1 && m <= 12) {
      const nextMonthIndex0 = m - 1;
      setMonthIndex0((prev) =>
        prev === nextMonthIndex0 ? prev : nextMonthIndex0
      );
    }
  }, [searchParams]);

  // --- 現場絞り込み（URL管理） ---
  const filterSiteId = searchParams.get("siteId");

  const pushUrl = (params: URLSearchParams) => {
    const qs = params.toString();
    router.push(qs ? `/calendar?${qs}` : "/calendar");
  };

  const replaceUrl = (params: URLSearchParams) => {
    const qs = params.toString();
    router.replace(qs ? `/calendar?${qs}` : "/calendar");
  };

  const onChangeSite = (nextSiteId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    // nextSiteId が null または 空文字 の場合はクエリを消す
    if (nextSiteId === null || nextSiteId === "") {
      params.delete("siteId");
    } else {
      params.set("siteId", nextSiteId);
    }

    pushUrl(params);
  };

  // --- 月操作（state + URL 同期） ---
  const updateMonth = (y: number, m0: number) => {
    setYear(y);
    setMonthIndex0(m0);
    setSelectedYmd(null);

    const params = new URLSearchParams(searchParams.toString());
    params.set("y", String(y));
    params.set("m", String(m0 + 1));
    pushUrl(params);
  };

  const goPrevMonth = () => {
    const next = addMonths(year, monthIndex0, -1);
    updateMonth(next.year, next.monthIndex0);
  };

  const goNextMonth = () => {
    const next = addMonths(year, monthIndex0, 1);
    updateMonth(next.year, next.monthIndex0);
  };

  const goToday = () => {
    updateMonth(now.getFullYear(), now.getMonth());
  };

  const todayYmd = ymdLocal(now);

  // --- 背景スクロール停止 ---
  React.useEffect(() => {
    if (!selectedYmd) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedYmd]);

  // --- 表示対象 ---
  const visibleSchedules = React.useMemo(() => {
    if (!filterSiteId) return initialSchedules;
    return initialSchedules.filter((s) => s.site?.id === filterSiteId);
  }, [initialSchedules, filterSiteId]);

  const schedulesByDay = React.useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of visibleSchedules) {
      if (!s.date) continue;
      const key = ymdLocal(new Date(s.date));
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [visibleSchedules]);

  const first = startOfMonth(year, monthIndex0);
  const firstDow = first.getDay();
  const totalDays = daysInMonth(year, monthIndex0);

  const cells: Array<{ date: Date | null; key: string }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ date: null, key: `b-${i}` });
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, monthIndex0, d);
    cells.push({ date, key: ymdLocal(date) });
  }

  const monthTitle = formatMonthTitle(year, monthIndex0);

  const selectedList = React.useMemo(() => {
    if (!selectedYmd) return [];
    return schedulesByDay.get(selectedYmd) ?? [];
  }, [selectedYmd, schedulesByDay]);

  return (
    <section className="space-y-4">
      {/* ヘッダー */}
      {/* ヘッダー（トップページ寄せ：見出し＋月バッジ） */}
      <PageHeader
        eyebrow="カレンダー"
        title="カレンダー"
        meta={
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs text-slate-600">
            {monthTitle}
          </span>
        }
        hint={<>※ 予定クリック：編集 / 日付クリック：その日の一覧</>}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* 現場セレクト */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-slate-700">現場</label>

            <SiteCombobox
              sites={sites}
              value={filterSiteId ?? null}
              onChange={onChangeSite}
            />

            {filterSiteId && (
              <button
                type="button"
                onClick={() => onChangeSite(null)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                絞り込み解除
              </button>
            )}
          </div>

          {/* 月切り替え + 今日へ + 共有 */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            
            <ShareCurrentViewButton />

            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              aria-label="前月へ"
            >
              ◀︎ 前月
            </button>

            <button
              type="button"
              onClick={() => {
                goToday();
                setSelectedYmd(todayYmd);
              }}
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800 hover:bg-sky-100 active:scale-[0.99]"
              title="選択中の現場の「今日の予定」を表示"
            >
              今日の予定
            </button>

            <button
              type="button"
              onClick={goToday}
              className="rounded-full bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              title="今月に戻る"
            >
              当月
            </button>

            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              次月 ▶︎
            </button>
          </div>
        </div>
      </PageHeader>

      <CardSection className="p-6" title={undefined}>
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="text-center text-xs font-medium text-slate-500">
              {w}
            </div>
          ))}
        </div>

        {/* 本体 */}
        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map(({ date, key }) => {
            if (!date) return <div key={key} className="h-28 rounded-xl border border-transparent" />;

            const ymd = ymdLocal(date);

            const holidayName = holidays?.[ymd] ?? "";
            const isHoliday = !!holidayName;

            const dow = date.getDay();
            const isSunday = dow === 0;
            const isSaturday = dow === 6;

            const list = schedulesByDay.get(ymd) ?? [];
            const isToday = ymd === todayYmd;

            // ✅ 背景ルール：今日 > 祝日/日曜 > 土曜 > 通常
            const base = isToday
              ? "border-sky-300 bg-sky-50"
              : isHoliday || isSunday
                ? "border-slate-200 bg-rose-50/70"
                : isSaturday
                  ? "border-slate-200 bg-sky-50/60"
                  : "border-slate-200 bg-white";

            return (
              <div
                key={key}
                onClick={() => setSelectedYmd(ymd)}
                className={[
                  "h-28 rounded-xl border p-2 transition",
                  "cursor-pointer hover:brightness-[0.98] active:scale-[0.99]",
                  base,
                ].join(" ")}
                title={isHoliday ? `${holidayName} の予定を表示` : "クリックでその日の予定を表示"}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  {/* ✅ 日曜は黒のまま / 祝日だけ赤 */}
                  <div className={`text-sm font-semibold ${isHoliday ? "text-rose-500" : "text-slate-900"}`}>
                    {date.getDate()}
                  </div>

                  <div className="min-w-0 text-right">
                    {isHoliday && (
                      <div className="truncate text-[10px] text-rose-400" title={holidayName}>
                        {holidayName}
                      </div>
                    )}
                    {list.length > 0 && <div className="text-[11px] text-slate-500">{list.length}件</div>}
                  </div>
                </div>

                <div className="space-y-1 overflow-hidden">
                  {list.slice(0, 3).map((s) => {
                    const meta = STATUS_META[s.status];
                    const cancelled = !!meta.isCancelled;

                    return (
                      <Link
                        key={s.id}
                        href={`/schedules/${s.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className={[
                          "group block rounded-md border px-2 py-1 text-xs transition",
                          cancelled ? "opacity-60" : "opacity-100",
                          meta.className,
                          "hover:brightness-95",
                        ].join(" ")}
                        title="クリックで編集"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {s.title}
                            {cancelled && (
                              <span className="ml-1 opacity-0 transition group-hover:opacity-70">
                                （中止）
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-[10px] opacity-70">{formatTime(s.date)}</span>
                        </div>
                      </Link>
                    );
                  })}

                  {list.length > 3 && <div className="text-[11px] text-slate-500">…他 {list.length - 3}件</div>}

                  {list.length === 0 && (
                    <div className="mt-6 text-center text-[11px] text-slate-400">クリックで予定を追加</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {visibleSchedules.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">予定はまだありません。</p>
            <p className="mt-1 text-sm text-slate-600">
              {filterSiteId ? "この現場にはまだ予定がありません。" : "「＋ 予定を追加」から登録できます。"}
            </p>
          </div>
        )}
      </CardSection>

      {/* ✅ モーダル */}
      {selectedYmd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedYmd(null)}
        >
          <div className="absolute inset-0 bg-black/30" />

          <div
            className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">この日の予定</p>
                <h3 className="text-base font-semibold text-slate-900">{selectedYmd}</h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedYmd(null)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
              {selectedList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-sm font-medium text-slate-900">この日は予定がありません。</p>
                  <p className="mt-1 text-xs text-slate-600">▼ 下の青いボタンから予定を追加できます。</p>

                  <Link
                    href={`/schedules/new?date=${encodeURIComponent(toDateTimeLocalFromYmd(selectedYmd, "09:00"))}`}
                    className="mt-3 inline-flex rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                  >
                    ＋ 予定を追加する
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{selectedList.length}件</p>
                    <Link
                      href={`/schedules/new?date=${encodeURIComponent(toDateTimeLocalFromYmd(selectedYmd, "09:00"))}`}
                      className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                    >
                      ＋ 予定を追加する
                    </Link>
                  </div>

                  {selectedList.map((s) => {
                    const meta = STATUS_META[s.status];
                    const cancelled = !!meta.isCancelled;

                    return (
                      <Link
                        key={s.id}
                        href={`/schedules/${s.id}/edit`}
                        className={[
                          "block rounded-xl border p-3 text-sm transition hover:bg-slate-50",
                          cancelled ? "opacity-60" : "opacity-100",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-900">{s.title}</div>
                            <div className="mt-1 text-xs text-slate-600">
                              {formatTime(s.date)}
                              {s.site?.name ? ` / ${s.site.name}` : ""}
                              {s.contractor?.name ? ` / ${s.contractor.name}` : ""}
                            </div>
                          </div>

                          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}>
                            {meta.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              ※ 予定：編集 / 日付：一覧（カレンダー上で確認しやすい表示です）
            </p>
          </div>
        </div>
      )}
    </section>
  );
}