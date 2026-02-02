import type { ScheduleStatus } from "./scheduleStatus";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function patchScheduleStatus(scheduleId: string, status: ScheduleStatus) {
  const res = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PATCH failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function createSchedule(input: {
  title: string;
  date: string;  //ISO文字列
  siteId: string;
}) {
  const res = await fetch(`${API_BASE_URL}/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function deleteSchedule(scheduleId: string) {
  const res = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE failed: ${res.status} ${text}`);
  }
  // Nest/Prisma は削除したレコードを返すことが多いけど、
  // UIでは基本使わないので返しておく程度でOK
  return res.json().catch(() => null);
}

export async function updateSchedule(
  scheduleId: string,
  input: { title: string; date: string; siteId: string }
) {
  const res = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PATCH failed: ${res.status} ${text}`);
  }

  return res.json();
}