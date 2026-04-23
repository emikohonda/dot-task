// apps/web/src/app/contractors/_components/ContractorForm.tsx
"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { CardSection } from "@/components/CardSection";
import {
  contractorFormSchema,
  type ContractorFormValues,
  toContractorCreatePayload,
} from "@/lib/validations/contractorSchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type Props = {
  mode: "create" | "edit";
  contractor: (ContractorFormValues & { id?: string }) | null;
};

export function ContractorForm({ mode, contractor }: Props) {
  const router = useRouter();

  const defaultValues: ContractorFormValues = useMemo(
    () =>
      contractor ?? {
        name: "",
        postalCode: "",
        address: "",
        phone: "",
        email: "",
        contacts: [{ name: "", phone: "", email: "" }],
      },
    [contractor]
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  // edit 共通化前提で reset を入れておく
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

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
    const payload = toContractorCreatePayload(values);

    try {
      if (mode === "edit" && !contractor?.id) {
        throw new Error("contractor.id が見つかりません");
      }

      const url =
        mode === "create"
          ? `${API_BASE}/contractors`
          : `${API_BASE}/contractors/${contractor?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `保存に失敗しました（${res.status}）`);
      }

      if (mode === "create") {
        router.push("/contractors?toast=created");
      } else {
        router.push(`/contractors/${contractor?.id}?toast=updated`);
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "保存に失敗しました。");
    }
  });

  const baseInputClass =
    "mt-1 block w-full rounded-md border bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ── 基本情報 ── */}
      <CardSection title="基本情報">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              外注先名（または個人名）
              <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                必須
              </span>
            </label>
            <input
              {...register("name")}
              disabled={isSubmitting}
              className={[
                baseInputClass,
                errors.name ? "border-rose-300" : "border-slate-200",
              ].join(" ")}
              placeholder="例：〇〇設備 / 〇〇電工 など"
            />
            {errors.name?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">郵便番号</label>
            <input
              {...register("postalCode")}
              disabled={isSubmitting}
              className={[baseInputClass, "border-slate-200"].join(" ")}
              placeholder="123-4567"
            />
            {errors.postalCode?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.postalCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">住所</label>
            <input
              {...register("address")}
              disabled={isSubmitting}
              className={[baseInputClass, "border-slate-200"].join(" ")}
            />
            {errors.address?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">電話番号</label>
            <input
              {...register("phone")}
              disabled={isSubmitting}
              className={[baseInputClass, "border-slate-200"].join(" ")}
            />
            {errors.phone?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">メールアドレス</label>
            <input
              {...register("email")}
              disabled={isSubmitting}
              className={[baseInputClass, "border-slate-200"].join(" ")}
            />
            {errors.email?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>
        </div>
      </CardSection>

      {/* ── 担当者 ── */}
      <CardSection title="担当者">
        {!hasAnyContact && (
          <p className="mb-3 text-xs text-slate-500">※ 担当者が登録されていません。</p>
        )}

        <div className="divide-y divide-slate-100">
          {fields.map((field, i) => (
            <div key={field.id} className="space-y-3 py-4 first:pt-0">
              <div>
                <label className="block text-sm font-medium text-slate-700">担当者名</label>
                <input
                  {...register(`contacts.${i}.name` as const)}
                  disabled={isSubmitting}
                  className={[baseInputClass, "border-slate-200"].join(" ")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">電話番号</label>
                <input
                  {...register(`contacts.${i}.phone` as const)}
                  disabled={isSubmitting}
                  className={[baseInputClass, "border-slate-200"].join(" ")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">メールアドレス</label>
                <input
                  {...register(`contacts.${i}.email` as const)}
                  disabled={isSubmitting}
                  className={[baseInputClass, "border-slate-200"].join(" ")}
                />
              </div>

              {i > 0 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-rose-200 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  この担当者を削除
                </button>
              )}
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

      {/* ── ボタン ── */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={[
            "w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors",
            isSubmitting
              ? "cursor-not-allowed bg-slate-400"
              : "bg-sky-600 hover:bg-sky-700",
          ].join(" ")}
        >
          {isSubmitting ? "保存中..." : mode === "create" ? "保存する" : "更新する"}
        </button>

        <Link
          href={mode === "edit" && contractor?.id ? `/contractors/${contractor.id}` : "/contractors"}
          aria-disabled={isSubmitting}
          className={[
            "flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold transition-colors",
            isSubmitting
              ? "pointer-events-none text-slate-400"
              : "text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
