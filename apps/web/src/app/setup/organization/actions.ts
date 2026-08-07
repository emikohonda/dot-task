// apps/web/src/app/setup/organization/actions.ts
"use server";

import { signOut } from "@/auth";

// 個人アカウント削除成功後のログアウト用
export async function signOutAfterAccountDeletion() {
  await signOut({ redirectTo: "/login" });
}

// 通常ログアウト用
export async function signOutCurrentUser() {
  await signOut({ redirectTo: "/login" });
}
