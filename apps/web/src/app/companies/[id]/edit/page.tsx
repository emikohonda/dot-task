// apps/web/src/app/companies/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyForm } from "../../_components/CompanyForm";
import { fromCompanyToFormValues } from "@/lib/validations/companySchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

async function fetchCompany(id: string) {
  try {
    const res = await fetch(`${API_BASE}/companies/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function CompanyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await fetchCompany(id);

  if (!raw) notFound();

  const company = { ...fromCompanyToFormValues(raw), id: raw.id };

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href={`/companies/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 取引先詳細に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          取引先を編集
        </h1>
      </div>

      <CompanyForm mode="edit" company={company} />
    </div>
  );
}
