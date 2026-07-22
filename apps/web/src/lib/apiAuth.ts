// apps/web/src/lib/apiAuth.ts
import "server-only";
import { SignJWT } from "jose";
import { auth } from "@/auth";

const AUTH_SECRET = process.env.AUTH_SECRET;

function getJwtSecret() {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set");
  }

  return new TextEncoder().encode(AUTH_SECRET);
}

export async function createApiToken() {
  const session = await auth();

  if (!session?.user?.userId) {
    throw new Error("createApiToken: セッションにuserIdがありません");
  }

  const { userId } = session.user;

  return new SignJWT({
    userId,
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
