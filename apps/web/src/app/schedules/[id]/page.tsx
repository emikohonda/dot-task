// apps/web/src/app/schedules/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  Building2,
  Handshake,
  CalendarClock,
  Users,
  Pencil,
} from "lucide-react";
import { CardSection } from "@/components/CardSection";
import { fetchScheduleById } from "@/lib/fetchers/schedules";
import type { Schedule } from "@/lib/fetchers/schedules";
import type { ReactNode } from "react";
import { ScheduleTime } from "@/app/schedules/_components/ScheduleTime";
import { formatScheduleTitle } from "@/lib/validations/scheduleSchemas";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日（${weekday}）`;
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base text-slate-900">
        {value ?? <span className="text-slate-500">—</span>}
      </div>
    </div>
  );
}

export default async function ScheduleDetailPage({
  params,
  searchParams,
}: {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?:
    | { back?: string }
    | Promise<{ back?: string }>;
}) {
  const { id } = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams ?? {});
  const rawBack = sp.back ?? "";
  const backHref = rawBack.startsWith("/") ? rawBack : "/schedules";

  const s = (await fetchScheduleById(id)) satisfies Schedule | null;
  if (!s) return notFound();

  const contractorNames =
    s.contractors
      ?.map((x) => x.contractor?.name ?? null)
      .filter((name): name is string => Boolean(name && name.trim())) ?? [];

  const employeeNames =
    s.employees
      ?.map((x) => x.employee?.name ?? null)
      .filter((name): name is string => Boolean(name && name.trim())) ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          {formatScheduleTitle(s.title)}
        </h1>
      </div>

      <CardSection title="予定内容">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem
            icon={<Calendar className="h-4 w-4" />}
            label="日程"
            value={formatDate(s.date)}
          />

          <InfoItem
            icon={<Clock className="h-4 w-4" />}
            label="作業時刻"
            value={
              <ScheduleTime
                startTime={s.startTime ?? null}
                endTime={s.endTime ?? null}
                variant="detail"
              />
            }
          />

          <InfoItem
            icon={<Building2 className="h-4 w-4" />}
            label="現場名"
            value={s.site?.name ?? <span className="text-slate-500">—</span>}
          />

          <InfoItem
            icon={<Users className="h-4 w-4" />}
            label="社員（自社）"
            value={
              employeeNames.length ? (
                <span>{employeeNames.join(" / ")}</span>
              ) : (
                <span className="text-slate-500">—</span>
              )
            }
          />

          <InfoItem
            icon={<Handshake className="h-4 w-4" />}
            label="協力会社"
            value={
              contractorNames.length ? (
                <span>{contractorNames.join(" / ")}</span>
              ) : (
                <span className="text-slate-500">—</span>
              )
            }
          />
        </div>
      </CardSection>

      <CardSection title="メモ">
        {s.description?.trim() ? (
          <p className="whitespace-pre-wrap text-base text-slate-800">
            {s.description}
          </p>
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </CardSection>

      <CardSection title="補足情報">
        <div className="grid gap-4 sm:grid-cols-2">
          {s.createdAt ? (
            <InfoItem
              icon={<CalendarClock className="h-4 w-4" />}
              label="作成日時"
              value={formatDateTime(s.createdAt)}
            />
          ) : null}
          {s.updatedAt ? (
            <InfoItem
              icon={<CalendarClock className="h-4 w-4" />}
              label="最終更新"
              value={formatDateTime(s.updatedAt)}
            />
          ) : null}
        </div>
      </CardSection>

      {/* 右下固定の編集FAB */}
      <Link
        href={
          backHref !== "/schedules"
            ? `/schedules/${s.id}/edit?back=${encodeURIComponent(backHref)}`
            : `/schedules/${s.id}/edit`
        }
        className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
        aria-label="編集する"
      >
        <Pencil className="h-5 w-5" />
        <span>編集する</span>
      </Link>
    </div>
  );
}