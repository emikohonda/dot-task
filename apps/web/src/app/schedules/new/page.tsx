// apps/web/src/app/schedules/new/page.tsx
import Link from "next/link";

import { fetchSites } from "@/lib/fetchers/sites";
import { fetchContractors } from "@/lib/fetchers/contractors";
import { fetchEmployees } from "@/lib/fetchers/employees";

import ScheduleForm from "../_components/ScheduleForm";

export const dynamic = "force-dynamic";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; siteId?: string; back?: string }>;
}) {
  const { date, siteId, back } = await searchParams;
  const backHref = back?.startsWith("/") ? back : undefined;

  const [sites, contractors, employees] = await Promise.all([
    fetchSites(200),
    fetchContractors(200),
    fetchEmployees(),
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href={backHref ?? "/schedules"}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          {backHref ? "◀︎ 一覧に戻る" : "◀︎ 予定一覧に戻る"}
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          予定を追加
        </h1>
      </div>

      <ScheduleForm
        mode="create"
        sites={sites}
        contractors={contractors}
        employees={employees}
        schedule={null}
        initialDate={date ?? null}
        initialSiteId={siteId ?? null}
        backHref={backHref}
      />
    </div>
  );
}