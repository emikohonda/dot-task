// apps/web/src/app/sites/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";
import SiteForm from "../../_components/SiteForm";

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

async function fetchSite(id: string) {
  try {
    const res = await fetch(`${API_BASE}/sites/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function SiteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [site, companies] = await Promise.all([fetchSite(id), fetchCompanies()]);

  if (!site) notFound();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="現場"
        title="現場を編集"
        right={
          <Link href={`/sites/${id}`} className="text-sm text-slate-600 hover:text-slate-900">
            戻る
          </Link>
        }
      />
      <SiteForm mode="edit" site={site} companies={companies} />
    </div>
  );
}
