// apps/web/src/app/api/companies/[id]/route.ts
import { NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const res = await fetch(`${API_BASE}/companies/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getApiAuthHeaders()),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "取引先の更新に失敗しました" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const res = await fetch(`${API_BASE}/companies/${id}`, {
      method: "DELETE",
      headers: await getApiAuthHeaders(),
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "取引先の削除に失敗しました" },
      { status: 500 },
    );
  }
}