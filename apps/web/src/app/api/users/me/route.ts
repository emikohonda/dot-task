// apps/web/src/app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

export async function DELETE() {
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
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
      { message: "アカウント削除に失敗しました" },
      { status: 500 },
    );
  }
}
