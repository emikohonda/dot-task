// apps/web/src/app/api/organizations/me/route.ts
import { NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/organizations/me`, {
      method: "GET",
      headers: await getApiAuthHeaders(),
      cache: "no-store",
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
      { message: "自社情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/organizations/me`, {
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
      { message: "自社情報の更新に失敗しました" },
      { status: 500 },
    );
  }
}