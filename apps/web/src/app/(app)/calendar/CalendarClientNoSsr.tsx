// apps/web/src/app/calendar/CalendarClientNoSsr.tsx
"use client";

import dynamic from "next/dynamic";
import type { CalendarClientProps } from "./CalendarClient";

const CalendarClient = dynamic<CalendarClientProps>(
  () => import("./CalendarClient"),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-[calc(100dvh-112px)] flex-col overflow-hidden bg-white" />
    ),
  }
);

export function CalendarClientNoSsr(props: CalendarClientProps) {
  return <CalendarClient {...props} />;
}