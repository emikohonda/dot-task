// apps/web/src/app/schedules/page.tsx
import { Suspense } from "react";
import { fetchSchedules } from "@/lib/fetchers/schedules";
import SchedulesClient from "./SchedulesClient";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const schedules = await fetchSchedules(100);
  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-slate-400">読み込み中…</div>}>
      <SchedulesClient initialSchedules={schedules} />
    </Suspense>
  );
}