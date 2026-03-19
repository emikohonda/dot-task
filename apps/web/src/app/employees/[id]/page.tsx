// apps/web/src/app/employees/[id]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";
import { ToastHandler } from "../ToastHandler";

type Employee = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  createdAt: string;
  updatedAt: string;
};

const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return baseUrl;
};

async function fetchEmployee(id: string): Promise<Employee | null> {
  const baseUrl = getApiBaseUrl();

  const url = `${baseUrl}/employees/${id}`;
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch employee: ${res.status} ${text}`);
  }

  return (await res.json()) as Employee;
}

const toTelHref = (phone?: string | null) => {
  const v = (phone ?? "").trim();
  if (!v) return null;
  const normalized = v.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
};

const toMailHref = (email?: string | null) => {
  const v = (email ?? "").trim();
  return v ? `mailto:${v}` : null;
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await fetchEmployee(id);
  if (!employee) notFound();

  const tel = toTelHref(employee.phone);
  const mail = toMailHref(employee.email);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="自社社員"
        title={employee.name}
        right={
          <div className="flex items-center gap-2">
            <Link
              href={`/employees/${employee.id}/edit`}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              編集
            </Link>
            <Link
              href="/employees"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              一覧に戻る
            </Link>
          </div>
        }
      />

      <CardSection title="基本情報">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 氏名 */}
          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-500">氏名</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{employee.name}</div>
          </div>

          {/* 役職・担当 */}
          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-500">役職・担当</div>
            <div className="mt-1 text-sm text-slate-800">
              {employee.role ?? <span className="text-slate-400">—</span>}
            </div>
          </div>

          {/* 電話 */}
          <div>
            <div className="text-xs font-medium text-slate-500">電話</div>
            <div className="mt-1">
              {tel ? (
                <a
                  href={tel}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  📞 {employee.phone}
                </a>
              ) : (
                <span className="text-sm text-slate-500">—</span>
              )}
            </div>
          </div>

          {/* メール */}
          <div>
            <div className="text-xs font-medium text-slate-500">メール</div>
            <div className="mt-1">
              {mail ? (
                <a
                  href={mail}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  ✉️ {employee.email}
                </a>
              ) : (
                <span className="text-sm text-slate-500">—</span>
              )}
            </div>
          </div>
        </div>
      </CardSection>

      <Suspense fallback={null}>
        <ToastHandler basePath={`/employees/${employee.id}`} />
      </Suspense>
    </div>
  );
}
