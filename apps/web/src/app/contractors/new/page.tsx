// apps/web/src/app/contractors/new/page.tsx
import Link from "next/link";
import { ContractorForm } from "../_components/ContractorForm";

export default function NewContractorPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href="/contractors"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 外注先一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          外注先を追加
        </h1>
      </div>

      <ContractorForm mode="create" contractor={null} />
    </div>
  );
}
