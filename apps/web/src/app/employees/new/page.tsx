// apps/web/src/app/employees/new/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const employeeFormSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  phone: z.string().optional(),
  email: z.string().email("メールアドレスの形式が正しくありません").or(z.literal("")).optional(),
  role: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function NewEmployeePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { name: "", phone: "", email: "", role: "" },
    mode: "onSubmit",
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload: Record<string, string> = { name: values.name.trim() };
    if (values.phone?.trim()) payload.phone = values.phone.trim();
    if (values.email?.trim()) payload.email = values.email.trim();
    if (values.role?.trim()) payload.role = values.role.trim();

    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `保存に失敗しました（${res.status}）`);
      }

      router.push("/employees?toast=created");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "保存に失敗しました。");
    }
  });

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="自社社員"
        title="社員を追加"
        right={
          <Link href="/employees" className="text-sm text-slate-600 hover:text-slate-900">
            一覧に戻る
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
                disabled={isSubmitting}
                className={[
                  "mt-1 w-full rounded-md border px-3 py-2",
                  errors.name
                    ? "border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200",
                ].join(" ")}
                placeholder="例：山田 太郎"
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
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                placeholder="例：現場監督、配管工"
              />
            </div>

            {/* 電話番号 */}
            <div>
              <label className="block text-sm text-slate-700">電話番号</label>
              <input
                {...register("phone")}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                placeholder="090-1234-5678"
              />
            </div>

            {/* メール */}
            <div>
              <label className="block text-sm text-slate-700">メール</label>
              <input
                {...register("email")}
                disabled={isSubmitting}
                className={[
                  "mt-1 w-full rounded-md border px-3 py-2",
                  errors.email
                    ? "border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200",
                ].join(" ")}
                placeholder="yamada@example.com"
              />
              {errors.email?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardSection>

        {/* ボタン */}
        <div className="flex justify-end gap-3">
          <Link
            href="/employees"
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

