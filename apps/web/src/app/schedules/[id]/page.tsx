// apps/web/src/app/schedules/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  Building2,
  Handshake,
  FileText,
  CalendarClock,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";
import { STATUS_META } from "@/lib/scheduleStatus";
import { fetchScheduleById } from "@/lib/fetchers/schedules";
import type { Schedule } from "@/lib/fetchers/schedules";
import type { ReactNode } from "react";
import { ScheduleTime } from "@/app/schedules/_components/ScheduleTime";
import { formatScheduleTitle } from "@/lib/validations/scheduleSchemas";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm text-slate-900">
        {value ?? <span className="text-slate-500">—</span>}
      </div>
    </div>
  );
}

export default async function ScheduleDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);

  const s = (await fetchScheduleById(id)) satisfies Schedule | null;
  if (!s) return notFound();

  const meta = STATUS_META[s.status];

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
      <PageHeader
        eyebrow="予定一覧"
        title={formatScheduleTitle(s.title)}
        right={
          <div className="flex items-center gap-2">
            <Link
              href={`/schedules/${s.id}/edit`}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              編集
            </Link>

            <Link
              href="/schedules"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              一覧に戻る
            </Link>
          </div>
        }
      />

      <CardSection title="予定内容">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

          {s.createdAt ? (
            <InfoItem
              icon={<CalendarClock className="h-4 w-4" />}
              label="作成日"
              value={formatDate(s.createdAt)}
            />
          ) : null}

          {s.updatedAt ? (
            <InfoItem
              icon={<CalendarClock className="h-4 w-4" />}
              label="更新日"
              value={formatDate(s.updatedAt)}
            />
          ) : null}
        </div>
      </CardSection>

      <CardSection title="メモ">
        <InfoItem
          icon={<FileText className="h-4 w-4" />}
          label="内容"
          value={
            s.description?.trim() ? (
              <p className="whitespace-pre-wrap text-slate-800">
                {s.description}
              </p>
            ) : (
              <span className="text-slate-500">—</span>
            )
          }
        />
      </CardSection>
    </div>
  );
}