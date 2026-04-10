// apps/web/src/app/sites/new/page.tsx
import Link from "next/link";
import SiteForm from "../_components/SiteForm";

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

export default async function NewSitePage() {
  const companies = await fetchCompanies();

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href="/sites"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 現場一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          現場を追加
        </h1>
      </div>
      <SiteForm mode="create" site={null} companies={companies} />
    </div>
  );
}
