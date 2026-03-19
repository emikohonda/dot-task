// apps/web/src/lib/validations/siteSchemas.ts
import { z } from "zod";

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

    companyId: z.string().min(1, "※ 元請会社を選択してください。"),

    startDate: dateOrEmpty,
    endDate: dateOrEmpty,

    contactIds: z.array(z.string()),
  })
  .superRefine((val, ctx) => {
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
      startDate: "",
      endDate: "",
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
    startDate: (site.startDate ?? "").slice(0, 10),
    endDate: (site.endDate ?? "").slice(0, 10),
    contactIds,
  };
}

export function toSitePayload(values: SiteFormValues) {
  return {
    name: values.name.trim(),
    address: values.address?.trim() ? values.address.trim() : null,
    companyId: values.companyId ? values.companyId : null,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    contactIds: values.contactIds,
  };
}
