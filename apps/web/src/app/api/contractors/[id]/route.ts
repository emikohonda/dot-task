// apps/web/src/app/api/contractors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

function copyResponseHeaders(res: Response) {
  const headers = new Headers();
  const contentType = res.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.text();

  const authHeaders = await getApiAuthHeaders();
  const headers = new Headers(authHeaders);
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}/contractors/${id}`, {
    method: "PATCH",
    cache: "no-store",
    headers,
    body,
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: copyResponseHeaders(res),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await fetch(`${API_BASE}/contractors/${id}`, {
    method: "DELETE",
    cache: "no-store",
    headers: await getApiAuthHeaders(),
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: copyResponseHeaders(res),
  });
}