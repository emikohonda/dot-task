// apps/web/src/app/contractors/_components/ContractorForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { CardSection } from "@/components/CardSection";
import { DeleteButton } from "@/components/DeleteButton";
import { Toast } from "@/components/Toast";
import {
  contractorFormSchema,
  type ContractorFormValues,
  toContractorCreatePayload,
  toContractorUpdatePayload,
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

  const handleDelete = async () => {
    if (!contractor?.id) return;

    try {
      setDeleteLoading(true);

      const res = await fetch(`${API_BASE}/contractors/${contractor.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setDeleteSucceeded(true);
      setToast({ show: true, message: "外注先を削除しました" });

      redirectTimerRef.current = window.setTimeout(() => {
        router.push("/contractors?toast=deleted");
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

  const defaultValues: ContractorFormValues = React.useMemo(
    () =>
      contractor ?? {
        name: "",
        postalCode: "",
        address: "",
        phone: "",
        email: "",
        contacts: [{ id: undefined, name: "", phone: "", email: "" }],
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

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  const watchedContacts = useWatch({ control, name: "contacts" }) ?? [];
  const hasAnyContact = React.useMemo(
    () =>
      watchedContacts.some(
        (c) =>
          (c?.name ?? "").trim() !== "" ||
          (c?.phone ?? "").trim() !== "" ||
          (c?.email ?? "").trim() !== ""
      ),
    [watchedContacts]
  );

  const onSubmit = handleSubmit(async (values) => {
    const payload =
      mode === "create"
        ? toContractorCreatePayload(values)
        : toContractorUpdatePayload(values);

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

  const isLocked = isSubmitting || deleteLoading || deleteSucceeded;

  const baseInputClass =
    "mt-1 block w-full rounded-md border bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100";

  return (
    <>
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
                disabled={isLocked}
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
                disabled={isLocked}
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
                disabled={isLocked}
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
                disabled={isLocked}
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
                disabled={isLocked}
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
                    disabled={isLocked}
                    className={[baseInputClass, "border-slate-200"].join(" ")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">電話番号</label>
                  <input
                    {...register(`contacts.${i}.phone` as const)}
                    disabled={isLocked}
                    className={[baseInputClass, "border-slate-200"].join(" ")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">メールアドレス</label>
                  <input
                    {...register(`contacts.${i}.email` as const)}
                    disabled={isLocked}
                    className={[baseInputClass, "border-slate-200"].join(" ")}
                  />
                </div>

                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={isLocked}
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
            onClick={() => append({ id: undefined, name: "", phone: "", email: "" })}
            disabled={isLocked}
            className="mt-4 text-sm font-medium text-sky-600 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ＋ 担当者を追加
          </button>
        </CardSection>

        {/* ── ボタン ── */}
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
              href={mode === "edit" && contractor?.id ? `/contractors/${contractor.id}` : "/contractors"}
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

            {mode === "edit" && contractor?.id && (
              <div className="flex-1">
                <DeleteButton
                  label="外注先"
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
