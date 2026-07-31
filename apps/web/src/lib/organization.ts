// apps/web/src/lib/organization.ts
import "server-only";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

export type OrganizationMe = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export type OrganizationMeResult =
  | {
      ok: true;
      organization: OrganizationMe;
    }
  | {
      ok: false;
      errorCode?: string;
      status: number;
    };

export async function fetchOrganizationMe(): Promise<OrganizationMeResult> {
  try {
    const res = await fetch(`${API_BASE}/organizations/me`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) {
      let body: { errorCode?: string } | null = null;

      try {
        body = await res.json();
      } catch {}

      return {
        ok: false,
        errorCode: body?.errorCode,
        status: res.status,
      };
    }

    return {
      ok: true,
      organization: await res.json(),
    };
  } catch {
    return {
      ok: false,
      status: 0,
    };
  }
}
