// apps/web/src/app/api/companies/route.ts
import { NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.toString();

    const res = await fetch(`${API_BASE}/companies${query ? `?${query}` : ""}`, {
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
      { message: "取引先一覧の取得に失敗しました" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/companies`, {
      method: "POST",
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
      { message: "取引先の作成に失敗しました" },
      { status: 500 },
    );
  }
}