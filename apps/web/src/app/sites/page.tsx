// apps/web/src/app/sites/page.tsx
import { Suspense } from "react";
import { fetchSites } from "@/lib/api";
import SitesClient from "./SitesClient";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const sites = await fetchSites(200, { tab: "active", sortDate: "asc" });

  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-slate-400">読み込み中…</div>}>
      <SitesClient initialSites={sites} />
    </Suspense>
  );
}