// apps/web/src/app/schedules/new/page.tsx
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

import { fetchSites } from "@/lib/fetchers/sites";
import { fetchContractors } from "@/lib/fetchers/contractors";
import { fetchEmployees } from "@/lib/fetchers/employees";

import ScheduleForm from "../_components/ScheduleForm";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const [sites, contractors, employees] = await Promise.all([
    fetchSites(200),
    fetchContractors(200),
    fetchEmployees(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="予定一覧"
        title="予定を追加"
        right={
          <Link href="/schedules" className="text-sm text-slate-600 hover:text-slate-900">
            一覧に戻る
          </Link>
        }
      />
      <CardSection title="予定内容">
        <ScheduleForm
          mode="create"
          sites={sites}
          contractors={contractors}
          employees={employees}
          schedule={null}
          initialDate={date ?? null}  // ← 追加
        />
      </CardSection>
    </div>
  );
}