// apps/web/src/lib/validations/scheduleSchemas.ts
import { z } from "zod";

/**
 * status（現場運用に強い）
 */
export const scheduleStatusSchema = z.enum([
  "TODO",
  "DOING",
  "HOLD",
  "DONE",
  "CANCELLED",
]);
export type ScheduleStatus = z.infer<typeof scheduleStatusSchema>;

/**
 * YYYY-MM-DD（厳密寄り）
 */
export const ymdSchema = z
  .string()
  .min(1, "日付は必須です")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD 形式で入力してください")
  .refine((s) => {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }, "存在しない日付です");

/**
 * HH:mm（任意）
 */
const hmBaseSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "時刻は HH:mm 形式で入力してください")
  .refine((s) => {
    const [hh, mm] = s.split(":").map(Number);
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  }, "存在しない時刻です");

export const hmSchema = hmBaseSchema.or(z.literal("")); // 空文字OK

/**
 * フォーム値（RHFで持つ形）
 */
export const scheduleFormSchema = z
  .object({
    siteId: z.string().min(1, "現場は必須です"),
    date: ymdSchema,
    title: z
      .string()
      .max(80, "タイトルは80文字以内にしてください")
      .optional()
      .or(z.literal("")),
    status: scheduleStatusSchema,

    // ✅ 複数協力会社（未選択OK＝空配列）
    contractorIds: z.array(z.string()).default([]),

    // ✅ 複数社員（未選択OK＝空配列）
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

/**
 * RHFの型は input でOK（default() が効く前提の入力型）
 */
export type ScheduleFormValues = z.input<typeof scheduleFormSchema>;

/**
 * APIのSchedule型（レスポンス想定）
 * contractors は中間テーブル経由
 */
export type ScheduleApi = {
  id: string;
  siteId: string;
  date: string;
  title: string | null;
  status: ScheduleStatus;

  description: string | null;

  startTime: string | null;
  endTime: string | null;

  site?: { id: string; name: string } | null;

  contractors?: { contractor: { id: string; name: string } }[];
  employees?: { employee: { id: string; name: string } }[];
};

/**
 * site 工期レンジ（外部データ）
 */
export type SiteRange = {
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
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

/**
 * API → フォーム（編集用）
 */
export function fromScheduleToFormValues(s: ScheduleApi | null): ScheduleFormValues {
  const contractorIds =
    s?.contractors?.map((x) => x.contractor.id).filter(Boolean) ?? [];

  const employeeIds =
    s?.employees?.map((x) => x.employee.id).filter(Boolean) ?? []; // ✅

  return {
    siteId: s?.siteId ?? "",
    date: s?.date ? normalizeToYmd(s.date) : todayYmd(),
    title: s?.title ?? "",
    status: s?.status ?? "TODO",

    contractorIds,
    employeeIds,

    note: s?.description ?? "",
    startTime: s?.startTime ?? "",
    endTime: s?.endTime ?? "",
  };
}

/**
 * フォーム → API payload
 */
export function toScheduleCreatePayload(v: ScheduleFormValues) {
  return {
    siteId: v.siteId,
    date: v.date,
    title: v.title?.trim() ?? "",
    status: v.status,

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

/**
 * 工期チェック
 */
export function validateScheduleWithinSiteRange(
  scheduleDate: string,
  site: SiteRange
): { ok: true } | { ok: false; message: string } {
  const { startDate, endDate } = site;
  if (!startDate && !endDate) return { ok: true };

  if (startDate && scheduleDate < startDate) {
    return { ok: false, message: `予定日は工期開始（${startDate}）以降にしてください` };
  }
  if (endDate && scheduleDate > endDate) {
    return { ok: false, message: `予定日は工期終了（${endDate}）以前にしてください` };
  }
  return { ok: true };
}

export function makeScheduleSchemaWithSiteRange(site: SiteRange) {
  return scheduleFormSchema.superRefine((val, ctx) => {
    const r = validateScheduleWithinSiteRange(val.date, site);
    if (!r.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: r.message,
      });
    }
  });
}

/**
 * ✅ 表示用：協力会社名
 */
export function formatContractorNames(s: ScheduleApi | null | undefined) {
  const names =
    s?.contractors?.map((x) => x.contractor?.name).filter(Boolean) ?? [];
  return names.length ? names.join(" / ") : "—";
}

/**
 * ✅ 表示用：作業内容タイトル
 */
export function formatScheduleTitle(title: string | null | undefined) {
  return title?.trim() ? title : "作業内容未入力";
}

/**
 * ✅ 表示用：自社社員用
 */
export function formatEmployeeNames(s: ScheduleApi | null | undefined) {
  const names =
    s?.employees?.map((x) => x.employee?.name).filter(Boolean) ?? [];
  return names.length ? names.join(" / ") : "—";
}
