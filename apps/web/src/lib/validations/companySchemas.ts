// apps/web/src/lib/validations/companySchemas.ts
import { z } from "zod";
import type { Company } from "@/lib/api";

const optionalEmailSchema = z
  .string()
  .trim()
  .max(100, "※ メールが長すぎます。")
  .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "※ メールアドレスの形式で入力してください。",
  });

/**
 * Contacts（フォーム入力用）
 * - RHF的には常に string で持つ（"" もOK）
 * - 既存担当者の差分更新用に id を保持する
 */
export const companyContactFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().max(50, "※ 担当者名が長すぎます。"),
  phone: z.string().trim().max(30, "※ 電話番号が長すぎます。"),
  email: optionalEmailSchema,
});

export const companyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "※ 会社名が入力されていません。")
    .max(100, "※ 会社名は100文字以内で入力してください。"),

  postalCode: z.string().trim().max(20, "※ 郵便番号が長すぎます。"),
  address: z.string().trim().max(200, "※ 住所が長すぎます。"),
  phone: z.string().trim().max(30, "※ 電話番号が長すぎます。"),
  email: optionalEmailSchema,

  contacts: z.array(companyContactFormSchema),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

/**
 * APIで取った Company をフォーム値へ変換
 */
export const fromCompanyToFormValues = (company: Company | null): CompanyFormValues => {
  if (!company) {
    return {
      name: "",
      postalCode: "",
      address: "",
      phone: "",
      email: "",
      contacts: [{ id: undefined, name: "", phone: "", email: "" }],
    };
  }

  const contacts = (company.contacts ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
  }));

  return {
    name: company.name ?? "",
    postalCode: company.postalCode ?? "",
    address: company.address ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",
    contacts: contacts.length > 0 ? contacts : [{ id: undefined, name: "", phone: "", email: "" }],
  };
};

const emptyToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

/**
 * フォームのcontactsから「空行」を落とす
 * - name が空でも phone/email が入っていれば残す
 * - id は保持する
 */
const normalizeContacts = (contacts: CompanyFormValues["contacts"]) =>
  contacts
    .map((c) => ({
      id: c.id,
      name: c.name.trim(),
      phone: emptyToUndefined(c.phone),
      email: emptyToUndefined(c.email),
    }))
    .filter((c) => c.name || c.phone || c.email);

/**
 * Create payload へ変換
 */
export const toCompanyCreatePayload = (v: CompanyFormValues) => ({
  name: v.name.trim(),
  postalCode: v.postalCode.trim() || undefined,
  address: v.address.trim() || undefined,
  phone: v.phone.trim() || undefined,
  email: v.email.trim() || null,
  contacts: normalizeContacts(v.contacts).map(({ id, ...rest }) => rest),
});

/**
 * Update payload へ変換
 */
export const toCompanyUpdatePayload = (v: CompanyFormValues) => ({
  name: v.name.trim(),
  postalCode: v.postalCode.trim() || undefined,
  address: v.address.trim() || undefined,
  phone: v.phone.trim() || undefined,
  email: v.email.trim() || null,
  contacts: normalizeContacts(v.contacts),
});