// apps/web/src/app/contractors/[id]/page.tsx
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

type Contractor = {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null; // 互換のため残す
  contacts?: Contact[];
  createdAt: string;
  updatedAt: string;
};

async function fetchContractor(id: string): Promise<Contractor | null> {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error("API_BASE_URL is not set");

  const url = `${baseUrl}/contractors/${id}`;
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch contractor: ${res.status} ${text}`);
  }

  // ✅ bodyは1回だけ読む
  return (await res.json()) as Contractor;
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

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contractor = await fetchContractor(id);
  if (!contractor) notFound();

  const contacts = contractor.contacts ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="協力会社"
        title={contractor.name}
        right={
          <div className="flex items-center gap-2">
            <Link
              href={`/contractors/${contractor.id}/edit`}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              編集
            </Link>

            <Link
              href="/contractors"
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
            <div className="text-xs font-medium text-slate-500">外注先名</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {contractor.name}
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-xs font-medium text-slate-500">住所</div>
            <div className="mt-1 break-words text-sm text-slate-800">
              {contractor.postalCode || contractor.address ? (
                <>
                  {contractor.postalCode ? (
                    <span className="mr-2 text-xs text-slate-500">
                      〒{contractor.postalCode}
                    </span>
                  ) : null}
                  {contractor.address ?? ""}
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
                const href = toTelHref(contractor.phone);
                return href ? (
                  <a
                    href={href}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    📞 {contractor.phone}
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
                const href = toMailHref(contractor.email);
                return href ? (
                  <a
                    href={href}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    ✉️ {contractor.email}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                );
              })()}
            </div>
          </div>

          {/* 互換: contactPerson が残ってる旧データ用（任意表示） */}
          {contractor.contactPerson ? (
            <div className="sm:col-span-2">
              <div className="text-xs font-medium text-slate-500">
                旧：担当者（移行前）
              </div>
              <div className="mt-1 text-sm text-slate-800">
                {contractor.contactPerson}
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