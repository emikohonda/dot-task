// apps/web/src/app/calendar/CalendarClient.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { motion, AnimatePresence } from "framer-motion";
import type { Schedule } from "@/lib/fetchers/schedules";
import {
  ymdLocal,
  formatMonthTitle,
  buildCalendarCells,
  groupByDate,
  addMonths,
  gridRange,
} from "./_components/calendar";
import { getSiteColor } from "@/lib/siteColors";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;
const STORAGE_KEY = "calendar:selectedYmd";
const MONTH_STORAGE_KEY = "calendar:visibleMonth";
const MONTH_DATA_STORAGE_PREFIX = "calendar:monthSchedules:";

async function fetchGridSchedules(year: number, month0: number): Promise<Schedule[] | null> {
  try {
    const { from, to } = gridRange(year, month0);
    const params = new URLSearchParams({ dateFrom: from, dateTo: to, limit: "200" });

    const res = await fetch(`/api/schedules?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;

    return [];
  } catch {
    return null;
  }
}

// 下部一覧専用：選択日の1日分だけ取得
async function fetchSchedulesByDate(ymd: string): Promise<Schedule[]> {
  try {
    const params = new URLSearchParams({
      dateFrom: ymd,
      dateTo: ymd,
      limit: "200",
    });

    const res = await fetch(`/api/schedules?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;

    return [];
  } catch {
    return [];
  }
}

// ── sessionStorage helpers ──
function monthKey(y: number, m0: number) {
  return `${y}-${String(m0 + 1).padStart(2, "0")}`;
}

function saveMonthSchedules(y: number, m0: number, data: Schedule[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    `${MONTH_DATA_STORAGE_PREFIX}${monthKey(y, m0)}`,
    JSON.stringify(data)
  );
}

function loadMonthSchedules(y: number, m0: number): Schedule[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${MONTH_DATA_STORAGE_PREFIX}${monthKey(y, m0)}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const variants = {
  enter: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? "100%" : "-100%",
    opacity: 1,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir === 0 ? 0 : dir > 0 ? "-100%" : "100%",
    opacity: 1,
  }),
};

function formatTimeBlock(s: Schedule): { line1: string; line2: string } {
  if (!s.startTime) return { line1: "終日", line2: "" };
  return { line1: s.startTime, line2: s.endTime ?? "" };
}

function companyName(s: Schedule): string {
  return s.site?.company?.name ?? "元請未設定";
}

export type CalendarClientProps = {
  initialSchedules: Schedule[];
  initialYear: number;
  initialMonth0: number;
  holidays?: Record<string, string>;
};

export default function CalendarClient({
  initialSchedules,
  initialYear,
  initialMonth0,
  holidays = {},
}: CalendarClientProps) {

  const router = useRouter();

  const nowRef = React.useRef(new Date());
  const now = nowRef.current;
  const todayYmd = ymdLocal(now);

  const [year, setYear] = React.useState(() => {
    if (typeof window === "undefined") return initialYear;
    const saved = sessionStorage.getItem(MONTH_STORAGE_KEY);
    if (saved && /^\d{4}-\d{2}$/.test(saved)) return Number(saved.split("-")[0]);
    return initialYear;
  });

  const [month0, setMonth0] = React.useState(() => {
    if (typeof window === "undefined") return initialMonth0;
    const saved = sessionStorage.getItem(MONTH_STORAGE_KEY);
    if (saved && /^\d{4}-\d{2}$/.test(saved)) return Number(saved.split("-")[1]) - 1;
    return initialMonth0;
  });

  const [schedules, setSchedules] = React.useState<Schedule[]>(() => {
    if (typeof window === "undefined") return initialSchedules;
    const saved = sessionStorage.getItem(MONTH_STORAGE_KEY);
    if (saved && /^\d{4}-\d{2}$/.test(saved)) {
      const [savedYear, savedMonthNumber] = saved.split("-").map(Number);
      const cachedData = loadMonthSchedules(savedYear, savedMonthNumber - 1);
      if (cachedData) return cachedData;
    }
    return initialSchedules;
  });
  const [direction, setDirection] = React.useState(0);
  const [selectedYmd, setSelectedYmd] = React.useState<string>(todayYmd);
  const [selectedReady, setSelectedReady] = React.useState(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Schedule[]>([]);

  const [cache, setCache] = React.useState<Record<string, Schedule[]>>(() => {
    const initialKey = monthKey(initialYear, initialMonth0);
    const result: Record<string, Schedule[]> = { [initialKey]: initialSchedules };
    if (typeof window === "undefined") return result;
    const saved = sessionStorage.getItem(MONTH_STORAGE_KEY);
    if (saved && /^\d{4}-\d{2}$/.test(saved)) {
      const [savedYear, savedMonthNumber] = saved.split("-").map(Number);
      const cachedData = loadMonthSchedules(savedYear, savedMonthNumber - 1);
      if (cachedData) result[monthKey(savedYear, savedMonthNumber - 1)] = cachedData;
    }
    return result;
  });

  const monthRequestIdRef = React.useRef(0);

  const selectYmd = React.useCallback((ymd: string) => {
    setSelectedYmd(ymd);
    sessionStorage.setItem(STORAGE_KEY, ymd);
  }, []);

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    saveMonthSchedules(initialYear, initialMonth0, initialSchedules);

    const savedYmd = sessionStorage.getItem(STORAGE_KEY);
    if (savedYmd) setSelectedYmd(savedYmd);

    const savedMonth = sessionStorage.getItem(MONTH_STORAGE_KEY);
    if (savedMonth && /^\d{4}-\d{2}$/.test(savedMonth)) {
      const [savedYear, savedMonthNumber] = savedMonth.split("-").map(Number);
      const savedMonth0 = savedMonthNumber - 1;

      fetchGridSchedules(savedYear, savedMonth0).then((data) => {
        if (cancelled || data === null) return;

        setSchedules(data);
        setCache((prev) => ({
          ...prev,
          [monthKey(savedYear, savedMonth0)]: data,
        }));
        saveMonthSchedules(savedYear, savedMonth0, data);
      });
    }

    setSelectedReady(true);

    return () => {
      cancelled = true;
    };
  }, []);

  function saveVisibleMonth(y: number, m0: number) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(MONTH_STORAGE_KEY, monthKey(y, m0));
  }

  const goToMonth = React.useCallback(
    async (y: number, m0: number, dir: number) => {
      const requestId = monthRequestIdRef.current + 1;
      monthRequestIdRef.current = requestId;

      const key = monthKey(y, m0);
      const cachedData = cache[key] ?? loadMonthSchedules(y, m0);

      setDirection(dir);
      setYear(y);
      setMonth0(m0);
      saveVisibleMonth(y, m0);

      if (cachedData) {
        setSchedules(cachedData);
        setCache((prev) => ({
          ...prev,
          [key]: cachedData,
        }));

        const data = await fetchGridSchedules(y, m0);

        if (monthRequestIdRef.current !== requestId || data === null) return;

        setSchedules(data);
        setCache((prev) => ({ ...prev, [key]: data }));
        saveMonthSchedules(y, m0, data);

        return;
      }

      const data = await fetchGridSchedules(y, m0);

      if (monthRequestIdRef.current !== requestId || data === null) return;

      setSchedules(data);
      setCache((prev) => ({ ...prev, [key]: data }));
      saveMonthSchedules(y, m0, data);
    },
    [cache]
  );

  const byDate = React.useMemo(() => groupByDate(schedules), [schedules]);

  const goPrev = React.useCallback(() => {
    const next = addMonths(year, month0, -1);
    goToMonth(next.year, next.month0, -1);
  }, [year, month0, goToMonth]);

  const goNext = React.useCallback(() => {
    const next = addMonths(year, month0, 1);
    goToMonth(next.year, next.month0, 1);
  }, [year, month0, goToMonth]);

  React.useEffect(() => {
    if (!selectedReady) return;

    const { from, to } = gridRange(year, month0);

    // 表示中グリッド内の日付なら、予定あり/なしを即反映する
    if (selectedYmd >= from && selectedYmd <= to) {
      setSelectedSchedules(byDate.get(selectedYmd) ?? []);
      return;
    }

    // グリッド外の日付だけfetch
    let cancelled = false;

    (async () => {
      const data = await fetchSchedulesByDate(selectedYmd);
      if (!cancelled) setSelectedSchedules(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedReady, selectedYmd, byDate, year, month0]);

  // ── スワイプ検出（安全版）──
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);
  const isMultiTouch = React.useRef(false);
  const swipeLockRef = React.useRef(false);

  const resetTouchState = React.useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
    isMultiTouch.current = false;
  }, []);

  const onTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (swipeLockRef.current) {
        resetTouchState();
        return;
      }
      if (e.touches.length !== 1) {
        isMultiTouch.current = true;
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }
      isMultiTouch.current = false;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    },
    [resetTouchState]
  );

  const onTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      isMultiTouch.current = true;
    }
  }, []);

  const onTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      if (
        swipeLockRef.current ||
        isMultiTouch.current ||
        touchStartX.current === null ||
        touchStartY.current === null
      ) {
        resetTouchState();
        return;
      }

      const diffX = touchStartX.current - e.changedTouches[0].clientX;
      const diffY = touchStartY.current - e.changedTouches[0].clientY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      if (absX < 40) {
        resetTouchState();
        return;
      }
      if (absX <= absY * 1.1) {
        resetTouchState();
        return;
      }

      swipeLockRef.current = true;
      if (diffX > 0) goNext();
      else goPrev();
      resetTouchState();
      window.setTimeout(() => {
        swipeLockRef.current = false;
      }, 350);
    },
    [goNext, goPrev, resetTouchState]
  );

  const cells = React.useMemo(() => buildCalendarCells(year, month0), [year, month0]);
  const monthTitle = formatMonthTitle(year, month0);

  // 下部一覧は selectedSchedules を使う
  const selectedList = selectedSchedules;

  const selectedLabel = React.useMemo(() => {
    const [y, m, d] = selectedYmd.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("ja-JP", {
      // year: "numeric",  // ← 追加
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  }, [selectedYmd]);

  return (
    <div className="relative flex h-[calc(100dvh-112px)] flex-col overflow-hidden bg-white">
      {/* ── 月見出し ── */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-1 pt-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{monthTitle}</h1>
          {/* {loading && <span className="animate-pulse text-xs text-slate-400">読み込み中…</span>} */}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            aria-label="前月"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              goToMonth(now.getFullYear(), now.getMonth(), 0);
              selectYmd(todayYmd);
            }}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
          >
            今日
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            aria-label="次月"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── 曜日ヘッダー ── */}
      <div className="grid shrink-0 grid-cols-7 border-b border-slate-100">
        {WEEK_LABELS.map((w, i) => (
          <div
            key={w}
            className={[
              "py-1 text-center text-[11px] font-semibold",
              i === 0 ? "text-rose-400" : i === 6 ? "text-sky-500" : "text-slate-400",
            ].join(" ")}
          >
            {w}
          </div>
        ))}
      </div>

      {/* ── カレンダーグリッド（上部 約60%）── */}
      <div
        className="relative min-h-0 flex-[6] overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
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
            }}
            className="absolute inset-0 grid grid-cols-7 grid-rows-6 gap-px bg-slate-100"
          >
            {cells.map((date, idx) => {
              const ymd = ymdLocal(date);
              const isCurrentMonth = date.getMonth() === month0;
              const dow = date.getDay();
              const isSunday = dow === 0;
              const isSaturday = dow === 6;
              const isToday = ymd === todayYmd;
              const isSelected = selectedReady && ymd === selectedYmd;
              const isHoliday = !!holidays[ymd];
              const list = byDate.get(ymd) ?? [];
              const maxChips = 2;
              const overCount = Math.max(0, list.length - maxChips);

              return (
                <div
                  key={`${ymd}-${idx}`}
                  onClick={() => selectYmd(ymd)}
                  className={[
                    "relative flex cursor-pointer flex-col overflow-visible p-0.5 transition-colors active:bg-slate-200",
                    !isCurrentMonth
                      ? "bg-slate-50"
                      : isToday
                        ? "bg-rose-100"
                        : "bg-white hover:bg-slate-50",
                    isSelected
                      ? "ring-2 ring-inset ring-rose-500"
                      : "",
                  ].join(" ")}
                >

                  {/* 日付 */}
                  <div
                    className={[
                      "text-center font-semibold leading-none",
                      "text-[11px] [@media(max-height:740px)]:text-[10px]",
                      !isCurrentMonth
                        ? "text-slate-300"
                        : isToday
                          ? "text-slate-700"
                          : isHoliday
                            ? "text-rose-500"
                            : isSunday
                              ? "text-rose-500"
                              : isSaturday
                                ? "text-sky-500"
                                : "text-slate-700",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </div>

                  {/* 予定チップ */}
                  <div
                    className={[
                      "mt-0.5 min-h-0 flex-1 overflow-hidden",
                      "pb-3 [@media(max-height:740px)]:pb-2",
                    ].join(" ")}
                  >

                    {list.slice(0, maxChips).map((s) => {
                      const siteColor = getSiteColor(s.site?.color);

                      return (
                        <div
                          key={s.id}
                          className={[
                            "mb-px truncate rounded-[2px] px-0.5",
                            "text-[9px] leading-[14px] [@media(max-height:740px)]:text-[8px] [@media(max-height:740px)]:leading-[11px]",
                            !isCurrentMonth
                              ? "bg-slate-200 text-slate-400"
                              : `${siteColor.bgSoft} ${siteColor.text}`,
                          ].join(" ")}
                          title={s.site?.name ?? s.title ?? undefined}
                        >
                          {s.site?.name ?? s.title ?? "無題の予定"}
                        </div>
                      );
                    })}
                  </div>

                  {/* +N：中央下固定 */}
                  {overCount > 0 && (
                    <div
                      className={[
                        "absolute left-1/2 -translate-x-1/2 text-center font-bold",
                        "bottom-0.5 text-[8px] leading-3",
                        "[@media(max-height:740px)]:bottom-0 [@media(max-height:740px)]:text-[7px]",
                        !isCurrentMonth ? "text-slate-300" : "text-slate-400",
                      ].join(" ")}
                    >
                      +{overCount}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 下部：選択日の予定一覧（約40%）── */}
      <div className="flex min-h-0 flex-[4] flex-col border-t border-slate-200 bg-white">
        <div className="flex shrink-0 items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {selectedReady ? (
              <>
                <span className="text-sm font-bold text-slate-800">{selectedLabel}</span>
                <span className="text-xs text-slate-400">{selectedList.length}件</span>
              </>
            ) : (
              <span className="h-5 w-28" aria-hidden="true" />
            )}
          </div>

          {selectedReady ? (
            <Link
              href={`/calendar/day/${selectedYmd}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              一覧を見る
            </Link>
          ) : (
            <span className="h-7 w-20" aria-hidden="true" />
          )}
        </div>

        {/* 下部一覧：スクロール可・上への伝播を防ぐ */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}
        >
          {!selectedReady ? (
            <div className="py-6" aria-hidden="true" />
          ) : selectedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <p className="text-sm">予定はありません</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {selectedList.map((s) => {
                const { line1, line2 } = formatTimeBlock(s);
                const company = companyName(s);
                const siteName = s.site?.name ?? "";
                const siteColor = getSiteColor(s.site?.color);

                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/schedules/${s.id}`)}
                      className="flex w-full items-stretch gap-0 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
                    >
                      <div className="w-[52px] shrink-0 pr-2 text-right">
                        <p className="text-[13px] font-semibold leading-5 text-slate-700">{line1}</p>
                        <p className="text-[13px] font-semibold leading-5 text-slate-700">{line2}</p>
                      </div>
                      <div className="mx-2 w-px shrink-0 self-stretch bg-slate-200" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] leading-5 text-slate-500">{company}</p>
                        {siteName && (
                          <p
                            className={[
                              "flex items-center gap-1 truncate text-[15px] font-semibold leading-5",
                              siteColor.text,
                            ].join(" ")}
                          >
                            <MapPin className={["h-3.5 w-3.5 shrink-0", siteColor.text].join(" ")} />
                            {siteName}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* スマホ用FAB */}
      <FloatingAddButton href={`/schedules/new?date=${selectedYmd}`} />
    </div>
  );
}