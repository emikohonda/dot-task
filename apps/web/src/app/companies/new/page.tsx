// apps/web/src/app/companies/new/page.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

import {
  companyFormSchema,
  type CompanyFormValues,
  toCompanyCreatePayload,
} from "@/lib/validations/companySchemas";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default function NewCompanyPage() {
  const router = useRouter();

  const defaultValues: CompanyFormValues = {
    name: "",
    postalCode: "",
    address: "",
    phone: "",
    email: "",
    contacts: [{ name: "", phone: "", email: "" }],
  };

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  const watchedContacts = useWatch({ control, name: "contacts" }) ?? [];
  const hasAnyContact = useMemo(
    () => watchedContacts.some((c) => (c?.name ?? "").trim() !== ""),
    [watchedContacts]
  );

  const onSubmit = handleSubmit(async (values) => {
    const payload = toCompanyCreatePayload(values);

    try {
      const res = await fetch(`${API_BASE}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `保存に失敗しました（${res.status}）`);
      }

      router.push("/companies");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "保存に失敗しました。");
    }
  });

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="取引先"
        title="取引先を追加"
        right={
          <Link href="/companies" className="text-sm text-slate-600 hover:text-slate-900">
            一覧に戻る
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4">
        {/* 基本情報 */}
        <CardSection title="基本情報">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                会社名
                <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  必須
                </span>
              </label>
              <input
                {...register("name")}
                disabled={isSubmitting}
                className={[
                  "mt-1 w-full rounded-md border px-3 py-2",
                  errors.name
                    ? "border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200",
                ].join(" ")}
                placeholder="例：〇〇建設株式会社"
              />
              {errors.name?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-700">郵便番号</label>
              <input
                {...register("postalCode")}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                placeholder="123-4567"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700">住所</label>
              <input
                {...register("address")}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700">電話番号</label>
              <input
                {...register("phone")}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700">メール</label>
              <input
                {...register("email")}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>
          </div>
        </CardSection>

        {/* 担当者 */}
        <CardSection title="担当者">
          {!hasAnyContact && (
            <p className="mb-3 text-xs text-slate-500">※ 担当者が登録されていません。</p>
          )}

          <div className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="grid items-end gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-sm text-slate-700">担当者名</label>
                  <input
                    {...register(`contacts.${i}.name` as const)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700">連絡先電話番号</label>
                  <input
                    {...register(`contacts.${i}.phone` as const)}
                    disabled={isSubmitting}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-700">メール</label>
                    <input
                      {...register(`contacts.${i}.email` as const)}
                      disabled={isSubmitting}
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                    />
                  </div>

                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      disabled={isSubmitting}
                      className="mb-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ name: "", phone: "", email: "" })}
            disabled={isSubmitting}
            className="mt-4 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ＋ 担当者を追加
          </button>
        </CardSection>

        {/* 保存 */}
        <div className="flex justify-end gap-3">
          <Link
            href="/companies"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm"
          >
            キャンセル
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "rounded-md px-4 py-2 text-sm font-semibold text-white",
              isSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-sky-600 hover:bg-sky-700",
            ].join(" ")}
          >
            {isSubmitting ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}