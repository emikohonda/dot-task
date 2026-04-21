// apps/web/src/lib/validations/contractorSchemas.ts
import { z } from "zod";
import type { Contractor } from "@/lib/api";

export const contractorContactFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().max(50, "※ 担当者名が長すぎます。"),
  phone: z.string().trim().max(30, "※ 電話番号が長すぎます。"),
  email: z.string().trim().max(100, "※ メールが長すぎます。"),
});

export const contractorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "※ 外注先名（または個人名）が入力されていません。")
    .max(100, "※ 外注先名は100文字以内で入力してください。"),

  postalCode: z.string().trim().max(20, "※ 郵便番号が長すぎます。").optional().or(z.literal("")),
  address: z.string().trim().max(200, "※ 住所が長すぎます。").optional().or(z.literal("")),
  phone: z.string().trim().max(30, "※ 電話番号が長すぎます。").optional().or(z.literal("")),
  email: z.string().trim().max(100, "※ メールが長すぎます。").optional().or(z.literal("")),

  contacts: z.array(contractorContactFormSchema),
});

export type ContractorFormValues = z.infer<typeof contractorFormSchema>;

export const fromContractorToFormValues = (c: Contractor | null): ContractorFormValues => {
  if (!c) {
    return {
      name: "",
      postalCode: "",
      address: "",
      phone: "",
      email: "",
      contacts: [{ id: undefined, name: "", phone: "", email: "" }],
    };
  }

  const contacts = (c.contacts ?? []).map((x) => ({
    id: x.id,
    name: x.name ?? "",
    phone: x.phone ?? "",
    email: x.email ?? "",
  }));

  return {
    name: c.name ?? "",
    postalCode: c.postalCode ?? "",
    address: c.address ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    contacts: contacts.length > 0 ? contacts : [{ id: undefined, name: "", phone: "", email: "" }],
  };
};

const normalizeContacts = (contacts: ContractorFormValues["contacts"]) =>
  contacts
    .map((x) => ({
      id: x.id,
      name: x.name.trim(),
      phone: x.phone.trim(),
      email: x.email.trim(),
    }))
    .filter((x) => x.name || x.phone || x.email);

export const toContractorCreatePayload = (v: ContractorFormValues) => ({
  name: v.name.trim(),
  postalCode: v.postalCode?.trim() ? v.postalCode.trim() : undefined,
  address: v.address?.trim() ? v.address.trim() : undefined,
  phone: v.phone?.trim() ? v.phone.trim() : undefined,
  email: v.email?.trim() ? v.email.trim() : undefined,
  contacts: normalizeContacts(v.contacts).map(({ id, ...rest }) => rest),
});

export const toContractorUpdatePayload = (v: ContractorFormValues) => ({
  name: v.name.trim(),
  postalCode: v.postalCode?.trim() ? v.postalCode.trim() : undefined,
  address: v.address?.trim() ? v.address.trim() : undefined,
  phone: v.phone?.trim() ? v.phone.trim() : undefined,
  email: v.email?.trim() ? v.email.trim() : undefined,
  contacts: normalizeContacts(v.contacts),
});