// apps/web/src/app/api/sites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

function responseHeaders(res: Response) {
  return {
    "Content-Type": res.headers.get("content-type") ?? "application/json",
  };
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();

  const res = await fetch(`${API_BASE}/sites${query ? `?${query}` : ""}`, {
    method: "GET",
    cache: "no-store",
    headers: await getApiAuthHeaders(),
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: responseHeaders(res),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  const res = await fetch(`${API_BASE}/sites`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...(await getApiAuthHeaders()),
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: responseHeaders(res),
  });
}