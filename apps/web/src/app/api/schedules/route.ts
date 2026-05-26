// apps/web/src/app/api/schedules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const upstreamUrl = `${API_BASE}/schedules${url.search}`;

  const res = await fetch(upstreamUrl, {
    method: "GET",
    headers: await getApiAuthHeaders(),
    cache: "no-store",
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  const res = await fetch(`${API_BASE}/schedules`, {
    method: "POST",
    headers: {
      ...(await getApiAuthHeaders()),
      "content-type": req.headers.get("content-type") ?? "application/json",
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}