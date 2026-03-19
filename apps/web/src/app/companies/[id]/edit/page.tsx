// apps/web/src/app/companies/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// ✅ 修正：ハイフンを追加 "react-hook-form"
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

import type { Company } from "@/lib/api";
import { safeJson } from "@/lib/safeFetch";

import {
  companyFormSchema,
  type CompanyFormValues,
  fromCompanyToFormValues,
  toCompanyUpdatePayload,
} from "@/lib/validations/companySchemas";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001";

export default function EditCompanyPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams.id;

  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultValues: CompanyFormValues = fromCompanyToFormValues(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);

        const data = await safeJson<Company>(`${API_BASE}/companies/${id}`, {
          signal: controller.signal,
        });

        if (!data) {
          alert("取引先が見つかりませんでした（削除された可能性があります）");
          router.push("/companies");
          return;
        }

        reset(fromCompanyToFormValues(data));
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;

        console.error(e);
        alert(e instanceof Error ? e.message : "読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [id, reset, router]);

  // ✅ values に明示的に型を付けて any を回避
  const onSubmit = handleSubmit(async (values: CompanyFormValues) => {
    if (isDeleting) return;

    const payload = toCompanyUpdatePayload(values);

    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `更新に失敗しました（${res.status}）`);
      }

      router.push(`/companies/${id}?toast=updated`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    }
  });

  // ... (onDelete 以下のレンダリング部分は変更なしでOK)
  const onDelete = async () => {
    if (isDeleting || isSubmitting) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE}/companies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      router.push("/companies?toast=deleted");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading) return <div className="p-6">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="元請会社"
        title="取引先を編集"
        right={
          <Link
            href={`/companies/${id}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            戻る
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4">
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
                disabled={isSubmitting || isDeleting}
                className={[
                  "mt-1 w-full rounded-md border px-3 py-2",
                  errors.name
                    ? "border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200",
                ].join(" ")}
              />
              {errors.name?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-700">郵便番号</label>
              <input
                {...register("postalCode")}
                disabled={isSubmitting || isDeleting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700">住所</label>
              <input
                {...register("address")}
                disabled={isSubmitting || isDeleting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700">電話番号</label>
              <input
                {...register("phone")}
                disabled={isSubmitting || isDeleting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700">メール</label>
              <input
                {...register("email")}
                disabled={isSubmitting || isDeleting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>
          </div>
        </CardSection>

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
                    disabled={isSubmitting || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700">連絡先電話番号</label>
                  <input
                    {...register(`contacts.${i}.phone` as const)}
                    disabled={isSubmitting || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-700">メール</label>
                    <input
                      {...register(`contacts.${i}.email` as const)}
                      disabled={isSubmitting || isDeleting}
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                    />
                  </div>

                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      disabled={isSubmitting || isDeleting}
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
            disabled={isSubmitting || isDeleting}
            className="mt-4 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ＋ 担当者を追加
          </button>
        </CardSection>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isSubmitting || isDeleting}
            className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            削除する
          </button>

          <div className="flex justify-end gap-3">
            <Link
              href={`/companies/${id}`}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm"
            >
              キャンセル
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className={[
                "rounded-md px-4 py-2 text-sm font-semibold text-white",
                isSubmitting || isDeleting
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-sky-600 hover:bg-sky-700",
              ].join(" ")}
            >
              {isSubmitting ? "保存中..." : "更新する"}
            </button>
          </div>
        </div>
      </form>

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => !isDeleting && setIsDeleteOpen(false)}
            aria-label="close"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="text-sm font-semibold text-slate-900">
              この会社の情報を削除しますか？
            </div>
            <p className="mt-2 text-sm text-slate-600">
              削除すると元に戻せません。問題なければ「削除する」を押してください。
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}