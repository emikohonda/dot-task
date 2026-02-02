// apps/web/src/app/schedules/_components/ScheduleForm.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSchedule, updateSchedule, deleteSchedule } from "@/lib/schedulesApi";

type Site = { id: string; name: string };

type Props = {
  mode: "create" | "edit";
  sites: Site[];
  initialValues?: {
    id?: string;
    title: string;
    date: string | null; // ISO文字列想定
    siteId: string;
  };
};

function toDateTimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toISOFromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

function isValidDateTimeLocal(v: string) {
  // "YYYY-MM-DDTHH:mm" をざっくり検証（厳密すぎなくてOK）
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v);
}

export default function ScheduleForm({ mode, sites, initialValues }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ date クエリ（例: 2026-01-30T09:00）
  const dateFromQuery = searchParams.get("date");

  const [siteId, setSiteId] = React.useState(initialValues?.siteId ?? "");
  const [title, setTitle] = React.useState(initialValues?.title ?? "");

  const [dateLocal, setDateLocal] = React.useState(() => {
    // edit：initialValues が最優先
    if (mode === "edit") {
      if (!initialValues?.date) return "";
      return toDateTimeLocalValue(initialValues.date);
    }

    // create：クエリdateがあれば優先
    if (dateFromQuery && isValidDateTimeLocal(dateFromQuery)) {
      return dateFromQuery;
    }

    return "";
  });

  // ✅ Turbopack等で初期描画→クエリが後から入るケースにも対応
  React.useEffect(() => {
    if (mode !== "create") return;
    if (!dateFromQuery || !isValidDateTimeLocal(dateFromQuery)) return;

    // すでに手入力済みなら上書きしない（好み）
    setDateLocal((prev) => (prev ? prev : dateFromQuery));
  }, [mode, dateFromQuery]);

  const [errors, setErrors] = React.useState<{
    siteId?: string;
    title?: string;
    date?: string;
    form?: string;
  }>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!siteId) next.siteId = "現場を選択してください";
    if (!title.trim()) next.title = "タイトルを入力してください";
    if (!dateLocal) next.date = "日付を選択してください";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setErrors({});

    try {
      const isoDate = toISOFromDateTimeLocal(dateLocal);

      if (mode === "create") {
        await createSchedule({
          title: title.trim(),
          date: isoDate,
          siteId,
        });
      } else {
        if (!initialValues?.id) throw new Error("Schedule id is missing");

        await updateSchedule(initialValues.id, {
          title: title.trim(),
          date: isoDate,
          siteId,
        });
      }

      router.push("/schedules");
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        form: "保存に失敗しました。通信状態を確認してもう一度お試しください。",
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    if (mode !== "edit") return;
    const id = initialValues?.id;
    if (!id) {
      setErrors((prev) => ({ ...prev, form: "削除対象のIDが見つかりません。" }));
      return;
    }

    const ok = confirm("この予定を削除しますか？\n※ 削除すると元に戻せません");
    if (!ok) return;

    setIsSaving(true);
    setErrors({});

    try {
      await deleteSchedule(id);
      router.push("/schedules");
      router.refresh();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: "削除に失敗しました。通信状態を確認してもう一度お試しください。",
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errors.form}
        </div>
      )}

      {/* 現場選択 */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900">現場</label>
        <select
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">選択してください</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.siteId && <p className="text-xs text-rose-600">{errors.siteId}</p>}
      </div>

      {/* タイトル */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900">タイトル</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：防水、足場、配管 など"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
      </div>

      {/* 日付 */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-900">日付</label>
        <input
          type="datetime-local"
          value={dateLocal}
          onChange={(e) => setDateLocal(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        {errors.date && <p className="text-xs text-rose-600">{errors.date}</p>}
        <p className="text-xs text-slate-500">※ 現場で使いやすいように、時間も登録できます</p>
      </div>

      {/* ボタン */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
        >
          {isSaving ? "保存中…" : "保存する"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/schedules")}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          キャンセル
        </button>
      </div>

      {/* 削除 */}
      {mode === "edit" && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            className="text-sm font-semibold text-rose-600 hover:underline disabled:opacity-60"
          >
            予定を削除する
          </button>
          <p className="mt-2 text-xs text-slate-500">
            ⚠️「中止」は記録として残ります。「削除」は完全に消えます。
          </p>
        </div>
      )}
    </form>
  );
}