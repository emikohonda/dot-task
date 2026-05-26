// apps/web/src/app/api/sites/[id]/route.ts
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.text();

  const res = await fetch(`${API_BASE}/sites/${id}`, {
    method: "PATCH",
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const res = await fetch(`${API_BASE}/sites/${id}`, {
    method: "DELETE",
    cache: "no-store",
    headers: await getApiAuthHeaders(),
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: responseHeaders(res),
  });
}