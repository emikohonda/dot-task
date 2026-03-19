// apps/web/src/app/employees/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001";

const employeeFormSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  phone: z.string().optional(),
  email: z.string().email("メールアドレスの形式が正しくありません").or(z.literal("")).optional(),
  role: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

type Employee = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
};

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { name: "", phone: "", email: "", role: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/employees/${id}`, {
          signal: controller.signal,
        });

        if (res.status === 404) {
          alert("社員が見つかりませんでした");
          router.push("/employees");
          return;
        }
        if (!res.ok) throw new Error(`読み込みに失敗しました（${res.status}）`);

        const data: Employee = await res.json();
        reset({
          name: data.name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          role: data.role ?? "",
        });
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

  const onSubmit = handleSubmit(async (values) => {
    if (isDeleting) return;

    const payload: Record<string, string> = {
      name: values.name.trim(),
      phone: values.phone?.trim() ?? "",
      email: values.email?.trim() ?? "",
      role: values.role?.trim() ?? "",
    };

    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `更新に失敗しました（${res.status}）`);
      }

      router.push(`/employees/${id}?toast=updated`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "更新に失敗しました");
    }
  });

  const onDelete = async () => {
    if (isDeleting || isSubmitting) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE}/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      router.push("/employees?toast=deleted");
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
        eyebrow="自社社員"
        title="社員情報を編集"
        right={
          <Link href={`/employees/${id}`} className="text-sm text-slate-600 hover:text-slate-900">
            戻る
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <CardSection title="基本情報">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 氏名 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                氏名
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

            {/* 役職・担当 */}
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-700">役職・担当</label>
              <input
                {...register("role")}
                disabled={isSubmitting || isDeleting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                placeholder="例：現場監督、配管工"
              />
            </div>

            {/* 電話番号 */}
            <div>
              <label className="block text-sm text-slate-700">電話番号</label>
              <input
                {...register("phone")}
                disabled={isSubmitting || isDeleting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </div>

            {/* メール */}
            <div>
              <label className="block text-sm text-slate-700">メール</label>
              <input
                {...register("email")}
                disabled={isSubmitting || isDeleting}
                className={[
                  "mt-1 w-full rounded-md border px-3 py-2",
                  errors.email
                    ? "border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200",
                ].join(" ")}
              />
              {errors.email?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardSection>

        {/* ボタン */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isSubmitting || isDeleting}
            className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            削除する
          </button>

          <div className="flex gap-3">
            <Link
              href={`/employees/${id}`}
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

      {/* 削除確認モーダル */}
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
              この社員の情報を削除しますか？
            </div>
            <p className="mt-2 text-sm text-slate-600">
              削除すると元に戻せません。問題なければ「削除する」を押してください。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-rose-300"
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

