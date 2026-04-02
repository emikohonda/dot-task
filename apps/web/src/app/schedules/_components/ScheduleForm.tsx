// apps/web/src/app/schedules/_components/ScheduleForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Site, ContractorLite } from "@/lib/api";
import type { EmployeeLite } from "@/lib/fetchers/employees";

import {
  makeScheduleSchemaWithSiteRange,
  fromScheduleToFormValues,
  toScheduleCreatePayload,
  toScheduleUpdatePayload,
  type ScheduleApi,
  type ScheduleFormValues,
  type SiteRange,
  type ScheduleStatus,
} from "@/lib/validations/scheduleSchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001";

type Props = {
  mode: "create" | "edit";
  sites: Site[];
  contractors: ContractorLite[];
  employees: EmployeeLite[];
  schedule: ScheduleApi | null;
  initialDate?: string | null;
};

const statusLabel: Record<ScheduleStatus, string> = {
  TODO: "未着手",
  DOING: "進行中",
  HOLD: "保留",
  DONE: "完了",
  CANCELLED: "中止",
};

// ISO → YYYY-MM-DD
const toYmd = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : null);

export default function ScheduleForm({ mode, sites, contractors, employees, schedule, initialDate }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo<ScheduleFormValues>(() => {
    const v = fromScheduleToFormValues(schedule);
    return {
      ...v,
      date: mode === "create" && initialDate ? initialDate : v.date,
      contractorIds: v.contractorIds ?? [],
      employeeIds: v.employeeIds ?? [],
    };
  }, [schedule, initialDate, mode]);

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

        router.push("/schedules?toast=created");
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

      router.push(`/schedules?toast=updated`);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 現場 */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          現場名
          <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
            必須
          </span>
        </label>

        <select
          {...register("siteId")}
          disabled={isSubmitting}
          className={[
            "mt-1 w-full rounded-md border px-3 py-2",
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

      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          日付
          <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
            必須
          </span>
        </label>

        <input
          type="date"
          {...register("date")}
          disabled={isSubmitting}
          className={[
            "mt-1 w-full rounded-md border px-3 py-2",
            errors.date ? "border-rose-300" : "border-slate-200",
          ].join(" ")}
        />

        {errors.date?.message && (
          <p className="mt-1 text-xs text-rose-600">{errors.date.message}</p>
        )}
      </div>

      {/* 内容 */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          内容（短いタイトル）
          <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
            必須
          </span>
        </label>

        <input
          {...register("title")}
          disabled={isSubmitting}
          className={[
            "mt-1 w-full rounded-md border px-3 py-2",
            errors.title ? "border-rose-300" : "border-slate-200",
          ].join(" ")}
          placeholder="例：配管の仕上げ / 養生 / 検査対応 など"
        />

        {errors.title?.message && (
          <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>
        )}
      </div>

      {/* ステータス */}
      <div>
        <label className="block text-sm font-medium text-slate-700">状況</label>

        <select
          {...register("status")}
          disabled={isSubmitting}
          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
        >
          {(["TODO", "DOING", "HOLD", "DONE", "CANCELLED"] as const).map((k) => (
            <option key={k} value={k}>
              {statusLabel[k]}
            </option>
          ))}
        </select>

        {errors.status?.message && (
          <p className="mt-1 text-xs text-rose-600">{errors.status.message}</p>
        )}
      </div>

      {/* 時刻 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">開始時刻</label>
          <input
            type="time"
            {...register("startTime")}
            disabled={isSubmitting}
            className={[
              "mt-1 w-full rounded-md border px-3 py-2",
              errors.startTime ? "border-rose-300" : "border-slate-200",
            ].join(" ")}
          />
          {errors.startTime?.message && (
            <p className="mt-1 text-xs text-rose-600">{errors.startTime.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">終了時刻</label>
          <input
            type="time"
            {...register("endTime")}
            disabled={isSubmitting}
            className={[
              "mt-1 w-full rounded-md border px-3 py-2",
              errors.endTime ? "border-rose-300" : "border-slate-200",
            ].join(" ")}
          />
          {errors.endTime?.message && (
            <p className="mt-1 text-xs text-rose-600">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {/* 社員（複数） */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          社員（自社）
          {employees.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              {employees.length}名
            </span>
          )}
        </label>

        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {employees.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={e.id}
                  {...register("employeeIds")}
                  disabled={isSubmitting}
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

        <p className="mt-2 text-xs text-slate-500">※ 複数選択できます（未選択でも保存OK）</p>
      </div>

      {/* 協力会社（複数） */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          協力会社（外注先）
          {contractors.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              {contractors.length}社
            </span>
          )}
        </label>

        <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {contractors.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={c.id}
                  {...register("contractorIds")}
                  disabled={isSubmitting}
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

        <p className="mt-2 text-xs text-slate-500">※ 複数選択できます（未選択でも保存OK）</p>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-slate-700">メモ</label>
        <textarea
          {...register("note")}
          disabled={isSubmitting}
          className={[
            "mt-1 w-full rounded-md border px-3 py-2",
            errors.note ? "border-rose-300" : "border-slate-200",
          ].join(" ")}
          rows={4}
          placeholder="例：資材の搬入時間、注意点、連絡事項など"
        />
        {errors.note?.message && (
          <p className="mt-1 text-xs text-rose-600">{errors.note.message}</p>
        )}
      </div>

      {/* actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/schedules"
          className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className={[
            "rounded-xl px-4 py-3 text-sm font-semibold text-white",
            isSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-sky-600 hover:bg-sky-700",
          ].join(" ")}
        >
          {isSubmitting ? "保存中..." : mode === "create" ? "保存する" : "更新する"}
        </button>
      </div>
    </form>
  );
}
