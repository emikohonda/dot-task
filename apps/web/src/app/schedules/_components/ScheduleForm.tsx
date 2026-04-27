// apps/web/src/app/schedules/_components/ScheduleForm.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Site, ContractorLite } from "@/lib/api";
import type { EmployeeLite } from "@/lib/fetchers/employees";
import { CardSection } from "@/components/CardSection";
import { DeleteButton } from "@/components/DeleteButton";
import { Toast } from "@/components/Toast";

import {
  makeScheduleSchemaWithSiteRange,
  fromScheduleToFormValues,
  toScheduleCreatePayload,
  toScheduleUpdatePayload,
  type ScheduleApi,
  type ScheduleFormValues,
  type SiteRange,
} from "@/lib/validations/scheduleSchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type Props = {
  mode: "create" | "edit";
  sites: Site[];
  contractors: ContractorLite[];
  employees: EmployeeLite[];
  schedule: ScheduleApi | null;
  initialDate?: string | null;
  initialSiteId?: string | null;
  backHref?: string;
};

const toYmd = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null);

export default function ScheduleForm({
  mode,
  sites,
  contractors,
  employees,
  schedule,
  initialDate,
  initialSiteId,
  backHref,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSucceeded, setDeleteSucceeded] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  const redirectTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    if (!schedule?.id) return;

    try {
      setDeleteLoading(true);

      const res = await fetch(`${API_BASE}/schedules/${schedule.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setDeleteSucceeded(true);
      setToast({ show: true, message: "予定を削除しました" });

      redirectTimerRef.current = window.setTimeout(() => {
        router.push(backHref ?? "/schedules");
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

  const defaultValues = useMemo<ScheduleFormValues>(() => {
    const v = fromScheduleToFormValues(schedule);
    return {
      ...v,
      date: mode === "create" && initialDate ? initialDate : v.date,
      siteId: mode === "create" && initialSiteId ? initialSiteId : v.siteId,
      contractorIds: v.contractorIds ?? [],
      employeeIds: v.employeeIds ?? [],
    };
  }, [schedule, initialDate, initialSiteId, mode]);

  const [selectedSiteRange, setSelectedSiteRange] = useState<SiteRange>({
    startDate: null,
    endDate: null,
  });

  const schema = useMemo(
    () => makeScheduleSchemaWithSiteRange(selectedSiteRange),
    [selectedSiteRange]
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const siteId = useWatch({ control, name: "siteId" }) ?? "";

  useEffect(() => {
    const site = sites.find((s) => s.id === siteId);
    setSelectedSiteRange({
      startDate: toYmd(site?.startDate),
      endDate: toYmd(site?.endDate),
    });
  }, [siteId, sites]);

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        const payload = toScheduleCreatePayload(values);
        const res = await fetch(`${API_BASE}/schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `保存に失敗しました（${res.status}）`);
        }
        const createdRedirect = backHref
          ? `${backHref}${backHref.includes("?") ? "&" : "?"}toast=created`
          : "/schedules?toast=created";

        router.push(createdRedirect);
        router.refresh();
        return;
      }

      if (!schedule?.id) throw new Error("予定IDが見つかりません");
      const payload = toScheduleUpdatePayload(values);
      const res = await fetch(`${API_BASE}/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `更新に失敗しました。（${res.status}）`);
      }

      router.push(
        backHref
          ? `/schedules/${schedule.id}?toast=updated&back=${encodeURIComponent(backHref)}`
          : `/schedules/${schedule.id}?toast=updated`
      );
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  });

  const isLocked = isSubmitting || deleteLoading || deleteSucceeded;

  const baseInputClass =
    "mt-1 block min-w-0 w-full bg-white rounded-md border px-3 py-2 text-[16px] transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100";
  const dateTimeInputClass = `${baseInputClass} box-border max-w-full appearance-none overflow-hidden`;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <CardSection title="予定内容">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                現場名
                <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  必須
                </span>
              </label>
              <select
                {...register("siteId")}
                disabled={isLocked}
                className={[
                  baseInputClass,
                  errors.siteId ? "border-rose-300" : "border-slate-200",
                ].join(" ")}
              >
                <option value="">選択してください</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.siteId?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.siteId.message}</p>
              )}
              {(selectedSiteRange.startDate || selectedSiteRange.endDate) && (
                <p className="mt-2 text-xs text-slate-500">
                  工期: {selectedSiteRange.startDate ?? "未設定"} 〜{" "}
                  {selectedSiteRange.endDate ?? "未設定"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">作業内容</label>
              <input
                {...register("title")}
                disabled={isLocked}
                className={[
                  baseInputClass,
                  errors.title ? "border-rose-300" : "border-slate-200",
                ].join(" ")}
                placeholder="例：配管の仕上げ / 養生 / 検査対応 など"
              />
              {errors.title?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>
              )}
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="block text-sm font-medium text-slate-700">
                日程
                <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  必須
                </span>
              </label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-1">
                <input
                  type="date"
                  {...register("date")}
                  disabled={isLocked}
                  className={[
                    dateTimeInputClass,
                    errors.date ? "border-rose-300" : "border-slate-200",
                  ].join(" ")}
                />
                <span className="shrink-0 text-sm text-slate-400">〜</span>
                <input
                  type="date"
                  {...register("endDate")}
                  disabled={isLocked}
                  className={[
                    dateTimeInputClass,
                    errors.endDate ? "border-rose-300" : "border-slate-200",
                  ].join(" ")}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                終了日は任意です。1日のみの場合は空欄のままでOK。
              </p>
              {errors.date?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.date.message}</p>
              )}
              {errors.endDate?.message && (
                <p className="mt-1 text-xs text-rose-600">{errors.endDate.message}</p>
              )}
            </div>

            <div className="min-w-0 overflow-hidden sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                作業時刻
              </label>

              <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  type="time"
                  {...register("startTime")}
                  disabled={isLocked}
                  className={[
                    dateTimeInputClass,
                    errors.startTime ? "border-rose-300" : "border-slate-200",
                  ].join(" ")}
                />

                <span className="shrink-0 text-sm text-slate-400">〜</span>

                <input
                  type="time"
                  {...register("endTime")}
                  disabled={isLocked}
                  className={[
                    dateTimeInputClass,
                    errors.endTime ? "border-rose-300" : "border-slate-200",
                  ].join(" ")}
                />
              </div>

              {errors.startTime?.message && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.startTime.message}
                </p>
              )}

              {errors.endTime?.message && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>
        </CardSection>

        <CardSection title="作業者">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                社員（自社）
                {employees.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {employees.length}名
                  </span>
                )}
              </label>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {employees.map((e) => (
                    <label
                      key={e.id}
                      className="flex cursor-pointer items-center gap-3 text-[15px] text-slate-700"
                    >
                      <input
                        type="checkbox"
                        value={e.id}
                        {...register("employeeIds")}
                        disabled={isLocked}
                        className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>{e.name}</span>
                    </label>
                  ))}
                  {employees.length === 0 && (
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      社員がまだ登録されていません
                    </p>
                  )}
                </div>
              </div>
              {errors.employeeIds?.message && (
                <p className="mt-1 text-xs text-rose-600">
                  {String(errors.employeeIds.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                協力会社（外注先）
                {contractors.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {contractors.length}社
                  </span>
                )}
              </label>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {contractors.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 text-[15px] text-slate-700"
                    >
                      <input
                        type="checkbox"
                        value={c.id}
                        {...register("contractorIds")}
                        disabled={isLocked}
                        className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                  {contractors.length === 0 && (
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      協力会社がまだ登録されていません
                    </p>
                  )}
                </div>
              </div>
              {errors.contractorIds?.message && (
                <p className="mt-1 text-xs text-rose-600">
                  {String(errors.contractorIds.message)}
                </p>
              )}
            </div>
          </div>
        </CardSection>

        <CardSection title="メモ">
          <textarea
            {...register("note")}
            disabled={isLocked}
            className={[
              baseInputClass,
              errors.note ? "border-rose-300" : "border-slate-200",
            ].join(" ")}
            rows={4}
            placeholder="例：資材の搬入時間、注意点、連絡事項など"
          />
          {errors.note?.message && (
            <p className="mt-1 text-xs text-rose-600">{errors.note.message}</p>
          )}
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
              href={
                mode === "edit" && schedule?.id
                  ? backHref
                    ? `/schedules/${schedule.id}?back=${encodeURIComponent(backHref)}`
                    : `/schedules/${schedule.id}`
                  : backHref ?? "/schedules"
              }
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

            {mode === "edit" && schedule?.id && (
              <div className="flex-1">
                <DeleteButton
                  label="予定"
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