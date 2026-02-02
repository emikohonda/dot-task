import type { ScheduleStatus } from "@/lib/scheduleStatus";

export type Schedule = {
    id: string;
    title: string;
    date: string | null;
    status: ScheduleStatus;
    contractor?: { id: string; name: string } | null;
    site?: { id: string; name: string } | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function fetchSchedules(limit = 100): Promise<Schedule[]> {
    const res = await fetch(`${API_BASE_URL}/schedules?limit=${limit}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch schedules: ${res.status}`);
    }

    return res.json();
}