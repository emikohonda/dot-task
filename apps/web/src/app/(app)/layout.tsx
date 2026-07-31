// apps/web/src/app/(app)/layout.tsx
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { fetchOrganizationMe } from "@/lib/organization";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const result = await fetchOrganizationMe();

  if (
    !result.ok &&
    result.errorCode === "ORGANIZATION_MEMBERSHIP_REQUIRED"
  ) {
    redirect("/setup/organization");
  }

  return children;
}
