import Link from "next/link";
import { fetchSites } from "@/lib/fetchers/sites";
import { fetchScheduleById } from "@/lib/fetchers/scheduleById";
import ScheduleForm from "../../_components/ScheduleForm";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sites, schedule] = await Promise.all([
    fetchSites(200),
    fetchScheduleById(id),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">予定編集</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">予定を編集</h1>
          </div>

          <Link
            href="/schedules"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            一覧へ戻る
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <ScheduleForm
          mode="edit"
          sites={sites}
          initialValues={{
            id: schedule.id,
            title: schedule.title,
            date: schedule.date,
            siteId: schedule.site?.id ?? "",
          }}
        />
      </section>
    </main>
  );
}