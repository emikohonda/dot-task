// apps/web/src/app/employees/_components/EmployeeForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { CardSection } from "@/components/CardSection";
import { DeleteButton } from "@/components/DeleteButton";
import { Toast } from "@/components/Toast";
import {
  employeeFormSchema,
  type EmployeeFormValues,
  toEmployeePayload,
} from "@/lib/validations/employeeSchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type Props = {
  mode: "create" | "edit";
  employee: (EmployeeFormValues & { id?: string }) | null;
};

export function EmployeeForm({ mode, employee }: Props) {
  const router = useRouter();

  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteSucceeded, setDeleteSucceeded] = React.useState(false);
  const [toast, setToast] = React.useState({ show: false, message: "" });

  const redirectTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const defaultValues: EmployeeFormValues = React.useMemo(
    () =>
      employee ?? {
        name: "",
        phone: "",
        email: "",
        role: "",
      },
    [employee]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleDelete = async () => {
    if (!employee?.id) return;

    try {
      setDeleteLoading(true);

      const res = await fetch(`${API_BASE}/employees/${employee.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setDeleteSucceeded(true);
      setToast({ show: true, message: "社員を削除しました" });

      redirectTimerRef.current = window.setTimeout(() => {
        router.push("/employees");
        router.refresh();
      }, 1200);
    } catch {
      setToast({
        show: true,
        message: "削除に失敗しました。もう一度お試しください。",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = toEmployeePayload(values);

    try {
      const employeeId = employee?.id;

      if (mode === "edit" && !employeeId) {
        throw new Error("employee.id が見つかりません");
      }

      const url =
        mode === "create"
          ? `${API_BASE}/employees`
          : `${API_BASE}/employees/${employeeId}`;

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

      setToast({
        show: true,
        message: mode === "create" ? "社員を追加しました" : "社員を更新しました",
      });

      redirectTimerRef.current = window.setTimeout(() => {
        if (mode === "create") {
          router.push("/employees");
        } else {
          router.push(`/employees/${employeeId}`);
        }
        router.refresh();
      }, 1200);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "保存に失敗しました。");
    }
  });

  const isLocked = isSubmitting || deleteLoading || deleteSucceeded;

  const baseInputClass =
    "mt-1 block w-full rounded-md border bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100";

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <CardSection title="基本情報">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                氏名
                <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  必須
                </span>
              </label>
              <input
                {...register("name")}
                disabled={isLocked}
                className={[
                  baseInputClass,
                  errors.name ? "border-rose-300" : "border-slate-200",
                ].join(" ")}
                placeholder="例：山田 太郎"
              />
              {errors.name?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                役職・担当
              </label>
              <input
                {...register("role")}
                disabled={isLocked}
                className={[
                  baseInputClass,
                  errors.role ? "border-rose-300" : "border-slate-200",
                ].join(" ")}
                placeholder="例：現場監督、配管工"
              />
              {errors.role?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                電話番号
              </label>
              <input
                {...register("phone")}
                disabled={isLocked}
                className={[
                  baseInputClass,
                  errors.phone ? "border-rose-300" : "border-slate-200",
                ].join(" ")}
                placeholder="090-1234-5678"
              />
              {errors.phone?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                メールアドレス
              </label>
              <input
                {...register("email")}
                disabled={isLocked}
                className={[
                  baseInputClass,
                  errors.email ? "border-rose-300" : "border-slate-200",
                ].join(" ")}
                placeholder="yamada@example.com"
              />
              {errors.email?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardSection>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLocked}
            className={[
              "w-full min-h-[44px] rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors",
              isLocked
                ? "cursor-not-allowed bg-slate-400"
                : "bg-sky-600 hover:bg-sky-700",
            ].join(" ")}
          >
            {isSubmitting ? "保存中..." : mode === "create" ? "保存する" : "更新する"}
          </button>

          <div className="flex gap-3">
            <Link
              href={mode === "edit" && employee?.id ? `/employees/${employee.id}` : "/employees"}
              aria-disabled={isLocked}
              className={[
                "flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold transition-colors",
                isLocked
                  ? "pointer-events-none text-slate-400"
                  : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              キャンセル
            </Link>

            {mode === "edit" && employee?.id && (
              <div className="flex-1">
                <DeleteButton
                  label="社員"
                  loading={deleteLoading}
                  disabled={isSubmitting || deleteSucceeded}
                  onConfirm={handleDelete}
                />
              </div>
            )}
          </div>
        </div>
      </form>

      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}