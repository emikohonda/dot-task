// apps/web/src/app/companies/new/page.tsx
import Link from "next/link";
import { CompanyForm } from "../_components/CompanyForm";

export default function NewCompanyPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 取引先一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          取引先を追加
        </h1>
      </div>

      <CompanyForm mode="create" company={null} />
    </div>
  );
}