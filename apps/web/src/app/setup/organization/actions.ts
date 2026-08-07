// apps/web/src/app/setup/organization/actions.ts
"use server";

import { signOut } from "@/auth";

export async function signOutAfterAccountDeletion() {
  await signOut({ redirectTo: "/login" });
}
