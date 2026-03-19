// apps/web/src/app/sites/new/page.tsx
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import SiteForm from "../_components/SiteForm";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

async function fetchCompanies() {
  try {
    const res = await fetch(`${API_BASE}/companies`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function NewSitePage() {
  const companies = await fetchCompanies();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="現場一覧"
        title="現場を追加"
        right={
          <Link href="/sites" className="text-sm text-slate-600 hover:text-slate-900">
            一覧に戻る
          </Link>
        }
      />
      <SiteForm mode="create" site={null} companies={companies} />
    </div>
  );
}
