import { fetchSchedules } from "@/lib/fetchers/schedules";
import SchedulesClient from "./SchedulesClient";

export default async function SchedulesPage() {
  const schedules = await fetchSchedules(100);
  return <SchedulesClient initialSchedules={schedules} />;
}