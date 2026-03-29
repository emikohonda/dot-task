// apps/web/src/app/calendar/CalendarClient.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Schedule } from "@/lib/fetchers/schedules";
import { STATUS_META } from "@/lib/scheduleStatus";
import {
  ymdLocal,
  formatMonthTitle,
  buildCalendarCells,
  groupByDate,
  addMonths,
  monthRange,
} from "./_components/calendar";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

async function fetchMonthSchedules(year: number, month0: number): Promise<Schedule[]> {
  try {
    const { from, to } = monthRange(year, month0);
    const params = new URLSearchParams({ dateFrom: from, dateTo: to, limit: "200" });
    const res = await fetch(`${API_BASE}/schedules?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

type Props = {
  initialSchedules: Schedule[];
  initialYear: number;
  initialMonth0: number;
  holidays?: Record<string, string>;
};

// dir=0（今月ボタン）はフェードのみ、dir=±1は左右スライド
const variants = {
  enter: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export default function CalendarClient({
  initialSchedules,
  initialYear,
  initialMonth0,
  holidays = {},
}: Props) {
  const router = useRouter();

  const nowRef = React.useRef(new Date());
  const now = nowRef.current;
  const todayYmd = ymdLocal(now);

  const [year, setYear] = React.useState(initialYear);
  const [month0, setMonth0] = React.useState(initialMonth0);
  const [schedules, setSchedules] = React.useState<Schedule[]>(initialSchedules);
  const [loading, setLoading] = React.useState(false);
  const [direction, setDirection] = React.useState(0); // 1=次月, -1=前月, 0=今月

  const [cache, setCache] = React.useState<Record<string, Schedule[]>>({
    [`${initialYear}-${String(initialMonth0 + 1).padStart(2, "0")}`]: initialSchedules,
  });

  function monthKey(y: number, m0: number) {
    return `${y}-${String(m0 + 1).padStart(2, "0")}`;
  }

  const goToMonth = React.useCallback(
    async (y: number, m0: number, dir: number) => {
      setDirection(dir);
      setYear(y);
      setMonth0(m0);

      const key = monthKey(y, m0);
      if (cache[key]) {
        setSchedules(cache[key]);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchMonthSchedules(y, m0);
        setSchedules(data);
        setCache((prev) => ({ ...prev, [key]: data }));
      } finally {
        setLoading(false);
      }
    },
    [cache]
  );

  const goPrev = () => {
    const next = addMonths(year, month0, -1);
    goToMonth(next.year, next.month0, -1);
  };

  const goNext = () => {
    const next = addMonths(year, month0, 1);
    goToMonth(next.year, next.month0, 1);
  };

  // スワイプ検出
  const touchStartX = React.useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) goNext();
    else goPrev();
    touchStartX.current = null;
  };

  const byDate = React.useMemo(() => groupByDate(schedules), [schedules]);
  const cells = React.useMemo(() => buildCalendarCells(year, month0), [year, month0]);
  const monthTitle = formatMonthTitle(year, month0);

  return (
    <div className="relative flex h-[calc(100dvh-136px)] flex-col gap-0 overflow-hidden bg-white">

      {/* 月見出し */}
      <div className="flex shrink-0 items-center justify-between px-4 pt-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {monthTitle}
          </h1>
          {loading && (
            <span className="animate-pulse text-xs text-slate-400">更新中…</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="前月"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goToMonth(now.getFullYear(), now.getMonth(), 0)}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
          >
            今月
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="次月"
          >
            ›
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー：固定 */}
      <div className="grid shrink-0 grid-cols-7 border-b border-slate-100">
        {WEEK_LABELS.map((w, i) => (
          <div
            key={w}
            className={[
              "py-1.5 text-center text-[11px] font-semibold",
              i === 0 ? "text-rose-400" : i === 6 ? "text-sky-500" : "text-slate-400",
            ].join(" ")}
          >
            {w}
          </div>
        ))}
      </div>

      {/* カレンダー本体：スライドアニメーション */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`${year}-${month0}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 },
            }}
            className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-px bg-white"
          >
            {cells.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="bg-white" />;
              }

              const ymd = ymdLocal(date);
              const dow = date.getDay();
              const isSunday = dow === 0;
              const isSaturday = dow === 6;
              const isToday = ymd === todayYmd;
              const isHoliday = !!holidays[ymd];
              const list = byDate.get(ymd) ?? [];
              const overCount = Math.max(0, list.length - 2);

              return (
                <div
                  key={ymd}
                  onClick={() => router.push(`/calendar/day/${ymd}`)}
                  className={[
                    "flex cursor-pointer flex-col overflow-hidden p-0.5 transition-colors active:bg-slate-200",
                    isToday
                      ? "bg-white ring-2 ring-inset ring-slate-700"
                      : isHoliday || isSunday
                        ? "bg-rose-50"
                        : isSaturday
                          ? "bg-sky-100/60"
                          : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  {/* 日付 */}
                  <div
                    className={[
                      "pr-0.5 text-right text-[11px] font-semibold leading-none",
                      isToday
                        ? "text-sky-600"
                        : isHoliday
                          ? "text-rose-500"
                          : isSunday
                            ? "text-rose-400"
                            : isSaturday
                              ? "text-sky-500"
                              : "text-slate-700",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </div>

                  {/* 予定チップ：2件まで */}
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {list.slice(0, 2).map((s) => {
                      const meta = STATUS_META[s.status];
                      return (
                        <div
                          key={s.id}
                          className={[
                            "mb-px truncate rounded-[2px] px-0.5 text-[9px] leading-[14px]",
                            // Site.color 将来ここに色を反映
                            meta.className,
                          ].join(" ")}
                          title={s.title}
                        >
                          {s.title}
                        </div>
                      );
                    })}
                    {overCount > 0 && (
                      <div className="text-center text-[8px] leading-3 text-slate-400">
                        +{overCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* スマホ用FAB */}
      <Link
        href="/schedules/new"
        className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
        aria-label="予定を追加"
      >
        <Plus className="h-5 w-5" />
        <span>予定を追加</span>
      </Link>
    </div>
  );
}
