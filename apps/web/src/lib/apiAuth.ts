// apps/web/src/lib/apiAuth.ts
import "server-only";
import { SignJWT } from "jose";
import { auth } from "@/auth";

const AUTH_SECRET = process.env.AUTH_SECRET;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type BootstrapResponse = {
  userId: string;
  organizationId: string;
};

function getJwtSecret() {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set");
  }

  return new TextEncoder().encode(AUTH_SECRET);
}

async function bootstrapCurrentUser(): Promise<BootstrapResponse> {
  const session = await auth();

  const email = session?.user?.email;
  if (!email) {
    throw new Error("ログイン情報を取得できませんでした");
  }

  const res = await fetch(`${API_BASE}/auth/bootstrap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bootstrap-secret": AUTH_SECRET ?? "",
    },
    body: JSON.stringify({
      email,
      name: session.user?.name ?? null,
      image: session.user?.image ?? null,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "ユーザー初期化に失敗しました");
  }

  return res.json();
}

export async function createApiToken() {
  const { userId, organizationId } = await bootstrapCurrentUser();

  return new SignJWT({
    userId,
    organizationId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getJwtSecret());
}

export async function getApiAuthHeaders(): Promise<HeadersInit> {
  const token = await createApiToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}