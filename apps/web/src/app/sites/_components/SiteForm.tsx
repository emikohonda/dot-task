// apps/web/src/app/sites/_components/SiteForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { CardSection } from "@/components/CardSection";
import {
  siteFormSchema,
  type SiteFormValues,
  type SiteFormSource,
  fromSiteToFormValues,
  toSitePayload,
} from "@/lib/validations/siteSchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

// --------------------------------
// 型定義
// --------------------------------
type ContactOption = {
  id: string;
  name: string | null;
  phone?: string | null;
  email?: string | null;
};

export type CompanyOption = {
  id: string;
  name: string;
  contacts: ContactOption[];
};

type Props = {
  mode: "create" | "edit";
  site: SiteFormSource | null;
  companies: CompanyOption[];
};

// --------------------------------
// コンポーネント
// --------------------------------
export default function SiteForm({ mode, site, companies }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultValues = React.useMemo<SiteFormValues>(
    () => fromSiteToFormValues(site),
    [site]
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedCompanyId = useWatch({ control, name: "companyId" });
  const contactIds = useWatch({ control, name: "contactIds" }) ?? [];

  // 初期ロードとユーザー変更を区別するためのref
  const prevCompanyIdRef = React.useRef<string | undefined>(undefined);
  const didResetRef = React.useRef(false);

  React.useEffect(() => {
    if (!didResetRef.current) {
      prevCompanyIdRef.current = defaultValues.companyId;
      didResetRef.current = true;
      return;
    }

    // ユーザーが会社を変えた時だけ担当者をリセット
    const prev = prevCompanyIdRef.current;
    const changedByUser = prev !== undefined && prev !== watchedCompanyId;
    if (changedByUser) {
      setValue("contactIds", [], { shouldDirty: true });
    }

    // 現在の会社のcontactsに存在するIDだけ残す
    const selectedCompany = companies.find((c) => c.id === watchedCompanyId);
    const allowedIds = new Set((selectedCompany?.contacts ?? []).map((c) => c.id));
    const current = getValues("contactIds") ?? [];
    const filtered = current.filter((cid) => allowedIds.has(cid));
    if (filtered.length !== current.length) {
      setValue("contactIds", filtered, { shouldDirty: true });
    }

    prevCompanyIdRef.current = watchedCompanyId;
  }, [watchedCompanyId, companies, setValue, getValues, defaultValues.companyId]);

  const selectedCompany = React.useMemo(
    () => companies.find((c) => c.id === watchedCompanyId),
    [companies, watchedCompanyId]
  );

  const toggleContact = (contactId: string) => {
    const current = new Set(contactIds);
    if (current.has(contactId)) current.delete(contactId);
    else current.add(contactId);
    setValue("contactIds", Array.from(current), { shouldDirty: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const payload = toSitePayload(values);

      if (mode === "create") {
        const res = await fetch(`${API_BASE}/sites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(await res.text().catch(() => "作成に失敗しました"));
        }

        router.push("/sites?toast=created");
        router.refresh();
        return;
      }

      if (!site?.id) throw new Error("site.id が見つかりません");

      const res = await fetch(`${API_BASE}/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await res.text().catch(() => "更新に失敗しました"));
      }

      router.push(`/sites/${site.id}?toast=updated`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  });

  // 共通inputクラス（iPhoneズーム防止＋見た目統一）
  const baseInputClass =
    "mt-1 block min-w-0 w-full rounded-md border bg-white px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100";

  // date専用（iPhoneの横はみ出し対策）
  const dateInputClass = `${baseInputClass} box-border max-w-full appearance-none overflow-hidden`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <CardSection title="基本情報">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 現場名 */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              現場名
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
              placeholder="例：〇〇マンション新築工事"
            />
            {errors.name?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          {/* 住所 */}
          <div className="sm:col-span-2">
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

          {/* 開始日 */}
          <div className="min-w-0 overflow-hidden">
            <label className="block text-sm font-medium text-slate-700">開始日</label>
            <input
              type="date"
              {...register("startDate")}
              disabled={isSubmitting}
              className={[
                dateInputClass,
                errors.startDate ? "border-rose-300" : "border-slate-200",
              ].join(" ")}
            />
            {errors.startDate?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.startDate.message}</p>
            )}
          </div>

          {/* 終了日 */}
          <div className="min-w-0 overflow-hidden">
            <label className="block text-sm font-medium text-slate-700">終了日</label>
            <input
              type="date"
              {...register("endDate")}
              disabled={isSubmitting}
              className={[
                dateInputClass,
                errors.endDate ? "border-rose-300" : "border-slate-200",
              ].join(" ")}
            />
            {errors.endDate?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.endDate.message}</p>
            )}
          </div>
        </div>
      </CardSection>

      <CardSection title="現場担当者">
        <div className="space-y-4">
          {/* 元請会社 */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              元請会社
              <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                必須
              </span>
            </label>
            <select
              {...register("companyId")}
              disabled={isSubmitting}
              className={[
                baseInputClass,
                errors.companyId ? "border-rose-300" : "border-slate-200",
              ].join(" ")}
            >
              <option value="">-- 元請会社を選択 --</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
            {errors.companyId?.message && (
              <p className="mt-1 text-xs text-rose-600">{errors.companyId.message}</p>
            )}
          </div>

          {/* 担当者（会社選択時のみ表示） */}
          {watchedCompanyId && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                担当者（複数選択可）
              </label>

              {selectedCompany?.contacts?.length === 0 && (
                <p className="text-xs text-slate-500">
                  ※ この元請会社には担当者が登録されていません。
                </p>
              )}

              {(selectedCompany?.contacts?.length ?? 0) > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedCompany!.contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={contactIds.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">
                          {contact.name ?? "（名前未設定）"}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardSection>

      {/* actions */}
      <div className="flex gap-3">
        <Link
          href={mode === "edit" && site?.id ? `/sites/${site.id}` : "/sites"}
          className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-center text-sm text-slate-700 hover:bg-slate-50"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className={[
            "flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white",
            isSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-sky-600 hover:bg-sky-700",
          ].join(" ")}
        >
          {isSubmitting ? "保存中..." : mode === "create" ? "保存する" : "更新する"}
        </button>
      </div>
    </form>
  );
}