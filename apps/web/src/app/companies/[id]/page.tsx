// apps/web/src/app/companies/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

type Contact = {
  id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

type Company = {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null; // 互換のため残す
  contacts?: Contact[]; // APIが必ず返すなら contacts: Contact[] でもOK
  createdAt: string;
  updatedAt: string;
};

async function fetchCompany(id: string): Promise<Company | null> {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error("API_BASE_URL is not set");

  const url = `${baseUrl}/companies/${id}`;
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch company: ${res.status} ${text}`);
  }

  const text = await res.text().catch(() => "");
  if (!text.trim()) {
    throw new Error(`Empty body from API: GET ${url} (status ${res.status})`);
  }

  return JSON.parse(text) as Company;
}

const toTelHref = (phone?: string | null) => {
  const v = (phone ?? "").trim();
  if (!v) return null;
  const normalized = v.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
};

const toMailHref = (email?: string | null) => {
  const v = (email ?? "").trim();
  if (!v) return null;
  return `mailto:${v}`;
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await fetchCompany(id);
  if (!company) notFound();

  const contacts = company.contacts ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="元請会社"
        title={company.name}
        right={
          <div className="flex items-center gap-2">
            <Link
              href={`/companies/${company.id}/edit`}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              編集
            </Link>

            <Link
              href="/companies"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              一覧に戻る
            </Link>
          </div>
        }
      />

      {/* 基本情報 */}
      <CardSection title="基本情報">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-500">会社名</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {company.name}
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-500">住所</div>
            <div className="mt-1 break-words text-sm text-slate-800">
              {company.postalCode || company.address ? (
                <>
                  {company.postalCode ? (
                    <span className="mr-2 text-xs text-slate-500">
                      〒{company.postalCode}
                    </span>
                  ) : null}
                  {company.address ?? ""}
                </>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500">電話</div>
            <div className="mt-1">
              {(() => {
                const href = toTelHref(company.phone);
                return href ? (
                  <a
                    href={href}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    📞 {company.phone}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                );
              })()}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500">メール</div>
            <div className="mt-1">
              {(() => {
                const href = toMailHref(company.email);
                return href ? (
                  <a
                    href={href}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    ✉️ {company.email}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                );
              })()}
            </div>
          </div>

          {/* 互換: contactPerson が残ってる旧データ用（任意表示） */}
          {company.contactPerson ? (
            <div className="sm:col-span-2">
              <div className="text-xs font-medium text-slate-500">
                旧：担当者（移行前）
              </div>
              <div className="mt-1 text-sm text-slate-800">
                {company.contactPerson}
              </div>
            </div>
          ) : null}
        </div>
      </CardSection>

      {/* 担当者 */}
      <CardSection title="担当者">
        {contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              担当者が登録されていません
            </p>
            <p className="mt-1 text-sm text-slate-600">
              （後で編集機能を付けたらここから追加できるようにします）
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => {
              const tel = toTelHref(c.phone);
              const mail = toMailHref(c.email);

              return (
                <div
                  key={c.id ?? `${c.name}-${c.email ?? ""}-${c.phone ?? ""}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {c.name || "（名前未入力）"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        連絡先をタップで電話・メールできます
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tel ? (
                        <a
                          href={tel}
                          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                        >
                          📞 {c.phone}
                        </a>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                          📞 —
                        </span>
                      )}

                      {mail ? (
                        <a
                          href={mail}
                          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                        >
                          ✉️ {c.email}
                        </a>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                          ✉️ —
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardSection>
    </div>
  );
}