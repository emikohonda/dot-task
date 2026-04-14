// apps/web/src/app/page.tsx
import TodayPageContent from "./schedules/today/_components/TodayPageContent";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <TodayPageContent />;
}