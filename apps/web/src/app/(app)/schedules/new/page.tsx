// apps/web/src/app/schedules/new/page.tsx
import Link from "next/link";
import { fetchCompanies } from "@/lib/api";
import { fetchSites } from "@/lib/fetchers/sites";
import { fetchContractors } from "@/lib/fetchers/contractors";
import { fetchEmployees } from "@/lib/fetchers/employees";
import ScheduleForm from "../_components/ScheduleForm";

export const dynamic = "force-dynamic";

function parseYmd(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return undefined;
  return value;
}

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; siteId?: string; back?: string; from?: string }>;
}) {
  const { date, siteId, back, from } = await searchParams;

  const validInitialDate = parseYmd(date);

  const fromCalendar = from === "calendar";

  const explicitBackHref = back?.startsWith("/") ? back : undefined;

  // カレンダー経由のキャンセル時も /calendar?date=元の日付 に戻れるようにする
  const backHref =
    explicitBackHref ??
    (fromCalendar && validInitialDate
      ? `/calendar?date=${validInitialDate}`
      : undefined);

  const [sites, contractors, employees, companies] = await Promise.all([
    fetchSites(200),
    fetchContractors(200),
    fetchEmployees(),
    fetchCompanies(),
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href={backHref ?? "/schedules"}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          {fromCalendar ? "◀︎ カレンダーに戻る" : backHref ? "◀︎ 一覧に戻る" : "◀︎ 予定一覧に戻る"}
        </Link>
        <h1 className="text-center text-2xl font-bold leading-snug text-slate-900">
          予定を追加
        </h1>
      </div>

      <ScheduleForm
        mode="create"
        sites={sites}
        companies={companies}
        contractors={contractors}
        employees={employees}
        schedule={null}
        initialDate={validInitialDate ?? null}
        initialSiteId={siteId ?? null}
        backHref={backHref}
        from={from}
      />
    </div>
  );
}