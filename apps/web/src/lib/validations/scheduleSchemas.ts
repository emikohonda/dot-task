// apps/web/src/lib/validations/scheduleSchemas.ts
import { z } from "zod";

/** YYYY-MM-DD（必須） */
export const ymdSchema = z
  .string()
  .min(1, "日付は必須です")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD 形式で入力してください")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }, "存在しない日付です");

/** YYYY-MM-DD（任意・空文字OK） */
const optionalYmdSchema = z
  .string()
  .optional()
  .refine((s) => {
    if (!s || s === "") return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }, "存在しない日付です");

/** HH:mm（任意） */
const hmBaseSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "時刻は HH:mm 形式で入力してください")
  .refine((s) => {
    const [hh, mm] = s.split(":").map(Number);
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  }, "存在しない時刻です");

export const hmSchema = hmBaseSchema.or(z.literal(""));

/** フォーム値 */
export const scheduleFormSchema = z
  .object({
    siteId: z.string().min(1, "現場は必須です"),
    date: ymdSchema,
    endDate: optionalYmdSchema,
    title: z
      .string()
      .max(80, "タイトルは80文字以内にしてください")
      .optional()
      .or(z.literal("")),
    contractorIds: z.array(z.string()).default([]),
    employeeIds: z.array(z.string()).default([]),
    note: z
      .string()
      .max(1000, "メモは1000文字以内にしてください")
      .optional()
      .or(z.literal("")),
    startTime: hmSchema.optional(),
    endTime: hmSchema.optional(),
  })
  .superRefine((val, ctx) => {
    // 終了日 >= 開始日
    if (val.endDate && val.endDate.trim() && val.date) {
      if (val.endDate < val.date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "終了日は開始日以降にしてください",
        });
      }
    }

    // 開始時刻・終了時刻の整合性
    const hasStart = Boolean(val.startTime?.trim());
    const hasEnd = Boolean(val.endTime?.trim());

    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasStart ? ["endTime"] : ["startTime"],
        message: "開始時刻と終了時刻は両方入力してください",
      });
      return;
    }

    if (hasStart && hasEnd && val.startTime && val.endTime) {
      if (val.startTime > val.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "終了時刻は開始時刻より後にしてください",
        });
      }
    }
  });

export type ScheduleFormValues = z.input<typeof scheduleFormSchema>;

/** APIのSchedule型 */
export type ScheduleApi = {
  id: string;
  siteId: string;
  date: string;
  endDate?: string | null;
  title: string | null;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  site?: { id: string; name: string } | null;
  contractors?: { contractor: { id: string; name: string } }[];
  employees?: { employee: { id: string; name: string } }[];
};

/** site 工期レンジ */
export type SiteRange = {
  startDate: string | null;
  endDate: string | null;
};

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeToYmd(s: string) {
  return s.slice(0, 10);
}

/** API → フォーム（編集用） */
export function fromScheduleToFormValues(s: ScheduleApi | null): ScheduleFormValues {
  const contractorIds =
    s?.contractors?.map((x) => x.contractor.id).filter(Boolean) ?? [];
  const employeeIds =
    s?.employees?.map((x) => x.employee.id).filter(Boolean) ?? [];

  return {
    siteId: s?.siteId ?? "",
    date: s?.date ? normalizeToYmd(s.date) : todayYmd(),
    endDate: s?.endDate ? normalizeToYmd(s.endDate) : "",
    title: s?.title ?? "",
    contractorIds,
    employeeIds,
    note: s?.description ?? "",
    startTime: s?.startTime ?? "",
    endTime: s?.endTime ?? "",
  };
}

/** フォーム → API payload */
export function toScheduleCreatePayload(v: ScheduleFormValues) {
  return {
    siteId: v.siteId,
    date: v.date,
    endDate: v.endDate?.trim() ? v.endDate : null,
    title: v.title?.trim() ?? "",
    contractorIds: v.contractorIds ?? [],
    employeeIds: v.employeeIds ?? [],
    description: v.note?.trim() ? v.note.trim() : null,
    startTime: v.startTime?.trim() ? v.startTime : null,
    endTime: v.endTime?.trim() ? v.endTime : null,
  };
}

export function toScheduleUpdatePayload(v: ScheduleFormValues) {
  return toScheduleCreatePayload(v);
}

/** 工期チェック（開始日・終了日両方対応） */
export function validateScheduleWithinSiteRange(
  scheduleStartDate: string,
  scheduleEndDate: string | null | undefined,
  site: SiteRange,
): { ok: true } | { ok: false; path: "date" | "endDate"; message: string } {
  const { startDate, endDate } = site;
  if (!startDate && !endDate) return { ok: true };

  if (startDate && scheduleStartDate < startDate) {
    return { ok: false, path: "date", message: `開始日は工期開始（${startDate}）以降にしてください` };
  }
  if (endDate && scheduleStartDate > endDate) {
    return { ok: false, path: "date", message: `開始日は工期終了（${endDate}）以前にしてください` };
  }
  if (scheduleEndDate?.trim()) {
    if (startDate && scheduleEndDate < startDate) {
      return { ok: false, path: "endDate", message: `終了日は工期開始（${startDate}）以降にしてください` };
    }
    if (endDate && scheduleEndDate > endDate) {
      return { ok: false, path: "endDate", message: `終了日は工期終了（${endDate}）以前にしてください` };
    }
  }
  return { ok: true };
}

export function makeScheduleSchemaWithSiteRange(site: SiteRange) {
  return scheduleFormSchema.superRefine((val, ctx) => {
    const r = validateScheduleWithinSiteRange(val.date, val.endDate || null, site);
    if (!r.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [r.path], // ✅ endDate エラーは endDate フィールドに出る
        message: r.message,
      });
    }
  });
}

/** 表示用：日付範囲フォーマット */
export function formatDateRange(
  date: string | null | undefined,
  endDate?: string | null,
): string {
  if (!date) return "—";
  const startYmd = date.slice(0, 10);
  const endYmd = endDate ? endDate.slice(0, 10) : null;

  const [sy, sm, sd] = startYmd.split("-").map(Number);
  const startStr = `${sy}年${String(sm).padStart(2, "0")}月${String(sd).padStart(2, "0")}日`;

  if (!endYmd || endYmd === startYmd) {
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][
      new Date(sy, sm - 1, sd).getDay()
    ];
    return `${startStr}（${weekday}）`;
  }

  const [ey, em, ed] = endYmd.split("-").map(Number);
  const startWeekday = ["日", "月", "火", "水", "木", "金", "土"][
    new Date(sy, sm - 1, sd).getDay()
  ];
  const endWeekday = ["日", "月", "火", "水", "木", "金", "土"][
    new Date(ey, em - 1, ed).getDay()
  ];

  // 同じ年なら終了日の年を省略
  const endStr =
    sy === ey
      ? `${String(em).padStart(2, "0")}月${String(ed).padStart(2, "0")}日（${endWeekday}）`
      : `${ey}年${String(em).padStart(2, "0")}月${String(ed).padStart(2, "0")}日（${endWeekday}）`;

  return `${startStr}（${startWeekday}）〜 ${endStr}`;
}

/** 表示用：日付範囲（スラッシュ形式・一覧用） */
export function formatDateRangeShort(
  date: string | null | undefined,
  endDate?: string | null,
): string {
  if (!date) return "-";

  const startYmd = date.slice(0, 10);
  const [sy, sm, sd] = startYmd.split("-");
  const startStr = `${sy}/${sm}/${sd}`;

  const endYmd = endDate ? endDate.slice(0, 10) : null;
  if (!endYmd || endYmd === startYmd) return startStr;

  const [ey, em, ed] = endYmd.split("-");
  const endStr = sy === ey ? `${em}/${ed}` : `${ey}/${em}/${ed}`;

  return `${startStr} 〜 ${endStr}`;
}

/** 表示用：協力会社名 */
export function formatContractorNames(s: ScheduleApi | null | undefined) {
  const names =
    s?.contractors?.map((x) => x.contractor?.name).filter(Boolean) ?? [];
  return names.length ? names.join(" / ") : "—";
}

/** 表示用：作業内容タイトル */
export function formatScheduleTitle(title: string | null | undefined) {
  return title?.trim() ? title : "作業内容未入力";
}

/** 表示用：自社社員 */
export function formatEmployeeNames(s: ScheduleApi | null | undefined) {
  const names =
    s?.employees?.map((x) => x.employee?.name).filter(Boolean) ?? [];
  return names.length ? names.join(" / ") : "—";
}