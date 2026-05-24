// apps/web/src/app/api/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const res = await fetch(`${API_BASE}/employees`, {
    method: "POST",
    headers: {
      ...(await getApiAuthHeaders()),
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });

  const text = await res.text().catch(() => "");

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}