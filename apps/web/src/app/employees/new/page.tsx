// apps/web/src/app/employees/new/page.tsx
import Link from "next/link";
import { EmployeeForm } from "../_components/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 社員一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          社員を追加
        </h1>
      </div>

      <EmployeeForm mode="create" employee={null} />
    </div>
  );
}