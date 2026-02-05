// apps/web/src/app/companies/page.tsx
import Link from "next/link";

type Company = {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  createdAt: string;
  updatedAt: string;
};

async function fetchCompanies(): Promise<Company[]> {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error("API_BASE_URL is not set");

  const res = await fetch(`${baseUrl}/companies`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch companies: ${res.status}`);
  return res.json();
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {action ? <div className="sm:shrink-0">{action}</div> : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="text-base font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {cta ? <div className="mt-5 flex justify-center">{cta}</div> : null}
    </div>
  );
}

export default async function Page() {
  const companies = await fetchCompanies();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="取引先"
        description="元請会社（取引先）の住所や連絡先をまとめて管理します。"
        action={
          <Link
            href="/companies/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 active:bg-slate-900"
          >
            追加する
          </Link>
        }
      />

      {companies.length === 0 ? (
        <EmptyState
          title="まだ取引先が登録されていません"
          description="まずは1社登録しておくと、現場や予定の紐付けがスムーズになります。"
          cta={
            <Link
              href="/companies/new"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              最初の1社を登録
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500">
                  <th className="border-b border-slate-200 pb-3">会社名</th>
                  <th className="border-b border-slate-200 pb-3">担当</th>
                  <th className="border-b border-slate-200 pb-3">住所</th>
                  <th className="border-b border-slate-200 pb-3">連絡先</th>
                  <th className="border-b border-slate-200 pb-3 text-right">詳細</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-900">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-4 pr-4">
                      <div className="font-medium">{c.name}</div>
                      {c.postalCode || c.address ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {c.postalCode ? `〒${c.postalCode}` : ""}
                          {c.postalCode && c.address ? " " : ""}
                          {c.address ?? ""}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-4 pr-4 text-slate-700">{c.contactPerson ?? "—"}</td>

                    <td className="py-4 pr-4 text-slate-700">
                      {c.address ? (
                        <>
                          {c.postalCode ? <span className="text-xs text-slate-500">〒{c.postalCode} </span> : null}
                          {c.address}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-4 pr-4 text-slate-700">
                      <div>{c.phone ?? "—"}</div>
                      <div className="text-xs text-slate-500">{c.email ?? ""}</div>
                    </td>

                    <td className="py-4 text-right">
                      <Link
                        href={`/companies/${c.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 hover:bg-slate-50"
                      >
                        開く
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}