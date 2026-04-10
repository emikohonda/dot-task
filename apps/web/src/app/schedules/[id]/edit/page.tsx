// apps/web/src/app/schedules/[id]/edit/page.tsx
import Link from "next/link";

import { fetchSites } from "@/lib/fetchers/sites";
import { fetchContractors } from "@/lib/fetchers/contractors";
import { fetchScheduleById } from "@/lib/fetchers/scheduleById";
import { fetchEmployees } from "@/lib/fetchers/employees";
import ScheduleForm from "../../_components/ScheduleForm";
import { notFound } from "next/navigation";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sites, contractors, employees, schedule] = await Promise.all([
    fetchSites(200),
    fetchContractors(200),
    fetchEmployees(),
    fetchScheduleById(id),
  ]);

  if (!schedule) notFound();

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href={`/schedules/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 詳細に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">予定を編集</h1>
      </div>

        <ScheduleForm
          mode="edit"
          sites={sites}
          contractors={contractors}
          employees={employees}
          schedule={schedule}
        />
    </div>
  );
}