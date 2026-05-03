// apps/web/src/lib/validations/siteSchemas.ts
import { z } from "zod";
import { SITE_COLOR_KEYS, type SiteColorKey } from "@/lib/siteColors";

const siteColorSchema = z.enum(SITE_COLOR_KEYS);

function isSiteColorKey(color: string | null | undefined): color is SiteColorKey {
  return SITE_COLOR_KEYS.includes(color as SiteColorKey);
}

function normalizeSiteColor(color?: string | null): SiteColorKey {
  return isSiteColorKey(color) ? color : "sky";
}

// --------------------------------
// 共通バリデーション
// --------------------------------
const dateOrEmpty = z.union([
  z.literal(""),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "※ 日付の形式が不正です。"),
]);

export const siteFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "※ 現場名が入力されていません。")
      .max(100, "※ 現場名は100文字以内で入力してください。"),

    address: z.string().trim().max(200, "※ 住所が長すぎます。").optional().or(z.literal("")),

    // 既存会社ID（選択済みの場合）
    companyId: z.string().optional().or(z.literal("")),

    // 未登録会社名（新規追加の場合）
    companyNameToCreate: z
      .string()
      .trim()
      .max(100, "※ 元請会社名は100文字以内で入力してください。")
      .optional()
      .or(z.literal("")),

    startDate: dateOrEmpty,
    endDate: dateOrEmpty,

    color: siteColorSchema,

    contactIds: z.array(z.string()),
  })
  .superRefine((val, ctx) => {
    // 元請会社：companyId か companyNameToCreate のどちらかが必須
    const hasCompanyId = Boolean(val.companyId?.trim());
    const hasNewCompanyName = Boolean(val.companyNameToCreate?.trim());
    if (!hasCompanyId && !hasNewCompanyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyId"],
        message: "※ 元請会社を選択、または新規追加してください。",
      });
    }

    // 工期バリデーション
    if (val.startDate && val.endDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "※ 終了日は開始日より後の日付にしてください。",
      });
    }
  });

export type SiteFormValues = z.infer<typeof siteFormSchema>;

// --------------------------------
// SiteFormSource型（SiteForm.tsx と共有）
// --------------------------------
export type SiteFormSource = {
  id?: string;
  name?: string | null;
  address?: string | null;
  companyId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  color?: string | null;
  companyContacts?: Array<{ companyContact?: { id: string } | null }> | null;
};

// --------------------------------
// 変換ユーティリティ
// --------------------------------

export function fromSiteToFormValues(site: SiteFormSource | null): SiteFormValues {
  if (!site) {
    return {
      name: "",
      address: "",
      companyId: "",
      companyNameToCreate: "",
      startDate: "",
      endDate: "",
      color: "sky",
      contactIds: [],
    };
  }

  const contactIds = (site.companyContacts ?? [])
    .map((x) => x.companyContact?.id)
    .filter((v): v is string => Boolean(v));

  return {
    name: site.name ?? "",
    address: site.address ?? "",
    companyId: site.companyId ?? "",
    companyNameToCreate: "",
    startDate: (site.startDate ?? "").slice(0, 10),
    endDate: (site.endDate ?? "").slice(0, 10),
    color: normalizeSiteColor(site.color),
    contactIds,
  };
}

export function toSitePayload(values: SiteFormValues) {
  const companyNameToCreate = values.companyNameToCreate?.trim();
  return {
    name: values.name.trim(),
    address: values.address?.trim() ? values.address.trim() : null,
    // 既存会社を選んだ場合は companyId を送る、新規の場合は null
    companyId: values.companyId ? values.companyId : null,
    // 既存会社を選んでいる場合は companyNameToCreate を送らない
    companyNameToCreate: values.companyId ? undefined : companyNameToCreate || undefined,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    color: values.color,
    contactIds: values.contactIds,
  };
}
