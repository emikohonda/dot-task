// apps/web/src/lib/apiAuth.ts
import "server-only";
import { SignJWT } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET;

const TEMP_USER_ID = process.env.TEMP_USER_ID ?? "temp-user";
const TEMP_ORGANIZATION_ID =
  process.env.TEMP_ORGANIZATION_ID ??
  "00000000-0000-0000-0000-000000000001";

function getJwtSecret() {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set");
  }

  return new TextEncoder().encode(AUTH_SECRET);
}

export async function createApiToken() {
  return new SignJWT({
    userId: TEMP_USER_ID,
    organizationId: TEMP_ORGANIZATION_ID,
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