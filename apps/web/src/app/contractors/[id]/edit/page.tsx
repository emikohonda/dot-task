// apps/web/src/app/contractors/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContractorForm } from "../../_components/ContractorForm";
import { fromContractorToFormValues } from "@/lib/validations/contractorSchemas";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

async function fetchContractor(id: string) {
  try {
    const res = await fetch(`${API_BASE}/contractors/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ContractorEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await fetchContractor(id);

  if (!raw) notFound();

  const contractor = { ...fromContractorToFormValues(raw), id: raw.id };

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href={`/contractors/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 外注先詳細に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          外注先を編集
        </h1>
      </div>

      <ContractorForm mode="edit" contractor={contractor} />
    </div>
  );
}
