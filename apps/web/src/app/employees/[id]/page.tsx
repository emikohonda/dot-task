// apps/web/src/app/employees/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Phone, Mail, UserRound, BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";
import { CardSection } from "@/components/CardSection";

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
  return (
    process.env.API_BASE_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
    "http://127.0.0.1:3001"
  );
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

  const text = await res.text().catch(() => "");
  if (!text.trim()) {
    throw new Error(`Empty body from API: GET ${url} (status ${res.status})`);
  }

  return JSON.parse(text) as Employee;
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base text-slate-900">
        {value ?? <span className="text-slate-500">—</span>}
      </div>
    </div>
  );
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
    <div className="space-y-4 pb-10">
      <div className="space-y-2 px-1">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          {employee.name}
        </h1>
      </div>

      <CardSection title="基本情報">
        <div className="space-y-4">
          <InfoItem
            icon={<UserRound className="h-4 w-4" />}
            label="氏名"
            value={employee.name}
          />

          <InfoItem
            icon={<BadgeCheck className="h-4 w-4" />}
            label="役職・担当"
            value={employee.role?.trim() || "—"}
          />

          <InfoItem
            icon={<Phone className="h-4 w-4" />}
            label="電話番号"
            value={
              tel ? (
                <a
                  href={tel}
                  className="inline-flex max-w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 break-all hover:bg-slate-50"
                >
                  <span>{employee.phone}</span>
                </a>
              ) : (
                <span className="text-base text-slate-500">—</span>
              )
            }
          />

          <InfoItem
            icon={<Mail className="h-4 w-4" />}
            label="メールアドレス"
            value={
              mail ? (
                <a
                  href={mail}
                  className="inline-flex max-w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 break-all hover:bg-slate-50"
                >
                  <span>{employee.email}</span>
                </a>
              ) : (
                <span className="text-base text-slate-500">—</span>
              )
            }
          />
        </div>
      </CardSection>

      <Link
        href={`/employees/${employee.id}/edit`}
        className="fixed right-4 bottom-[calc(85px+env(safe-area-inset-bottom))] z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
        aria-label="編集する"
      >
        <Pencil className="h-5 w-5" />
        <span>編集する</span>
      </Link>

    </div>
  );
}