import { STATUS_META as CORE_META, type ScheduleStatus } from "@/lib/scheduleStatus";

export type { ScheduleStatus };

export function getStatusMeta(status: ScheduleStatus) {
  const m = CORE_META[status];
  return { label: m.label, className: m.className };
}