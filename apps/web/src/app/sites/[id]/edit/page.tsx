// apps/web/src/app/sites/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteForm from "../../_components/SiteForm";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:3001";

async function fetchCompanies() {
  try {
    const res = await fetch(`${API_BASE}/companies?limit=200`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
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
      <div className="space-y-2 px-1">
        <Link
          href={`/sites/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 現場詳細に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          現場を編集
        </h1>
      </div>

      <SiteForm mode="edit" site={site} companies={companies} />
    </div>
  );
}
