// apps/web/src/app/employees/[id]/edit/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployeeForm } from "../../_components/EmployeeForm";
import { fromEmployeeToFormValues } from "@/lib/validations/employeeSchemas";
import { getApiAuthHeaders } from "@/lib/apiAuth";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

async function fetchEmployee(id: string) {
  try {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[employees/edit] fetch failed:", res.status, text);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("[employees/edit] fetch error:", error);
    return null;
  }
}

export default async function EmployeeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await fetchEmployee(id);

  if (!raw) notFound();

  const employee = { ...fromEmployeeToFormValues(raw), id: raw.id };

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href={`/employees/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 社員詳細に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          社員を編集
        </h1>
      </div>

      <EmployeeForm mode="edit" employee={employee} />
    </div>
  );
}