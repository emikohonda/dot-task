// apps/web/src/lib/scheduleStatus.ts
export const SCHEDULE_STATUS = [
  "TODO",
  "DOING",
  "HOLD",
  "DONE",
  "CANCELLED",
] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUS)[number];

export const STATUS_META: Record<
  ScheduleStatus,
  {
    label: string;
    badgeVariant: "default" | "secondary" | "outline";
    className: string;
    isCancelled?: boolean;
  }
> = {
  TODO: {
    label: "未着手",
    badgeVariant: "secondary",
    className: "bg-slate-50 text-slate-700 border border-slate-200",
  },
  DOING: {
    label: "進行中",
    badgeVariant: "default",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  HOLD: {
    label: "待ち",
    badgeVariant: "outline",
    className: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  DONE: {
    label: "完了",
    badgeVariant: "secondary",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  CANCELLED: {
    label: "中止",
    badgeVariant: "outline",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
    isCancelled: true,
  },
};