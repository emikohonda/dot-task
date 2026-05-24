// apps/web/src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.text();

  const res = await fetch(`${API_BASE}/employees/${id}`, {
    method: "PATCH",
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

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const res = await fetch(`${API_BASE}/employees/${id}`, {
    method: "DELETE",
    headers: await getApiAuthHeaders(),
  });

  const text = await res.text().catch(() => "");

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}