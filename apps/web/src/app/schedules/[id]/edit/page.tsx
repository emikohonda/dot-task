// apps/web/src/app/schedules/[id]/edit/page.tsx
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

import { fetchSites } from "@/lib/fetchers/sites";
import { fetchContractors } from "@/lib/fetchers/contractors";
import { fetchScheduleById } from "@/lib/fetchers/scheduleById";
import { fetchEmployees } from "@/lib/fetchers/employees";

import ScheduleForm from "../../_components/ScheduleForm";

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

  if (!schedule) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="予定一覧"
          title="予定を編集"
          right={
            <Link href="/schedules" className="text-sm text-slate-600 hover:text-slate-900">
              一覧に戻る
            </Link>
          }
        />

        <CardSection title="エラー">
          <div className="p-6 text-sm text-slate-700">予定が見つかりませんでした。</div>
        </CardSection>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="予定一覧"
        title="予定を編集"
        right={
          <Link href={`/schedules/${id}`} className="text-sm text-slate-600 hover:text-slate-900">
            戻る
          </Link>
        }
      />

      <CardSection title="予定内容">
        <ScheduleForm
          mode="edit"
          sites={sites}
          contractors={contractors}
          employees={employees}
          schedule={schedule}
        />
      </CardSection>
    </div>
  );
}