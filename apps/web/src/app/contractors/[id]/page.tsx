// apps/web/src/app/contractors/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  Phone,
  Mail,
  Building2,
  MapPin,
} from "lucide-react";
import type { ReactNode } from "react";
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
  contactPerson: string | null;
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

  return (await res.json()) as Contractor;
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
  if (!v) return null;
  return `mailto:${v}`;
};

function ContactChip({
  kind,
  href,
  text,
}: {
  kind: "phone" | "mail";
  href: string | null;
  text: string | null | undefined;
}) {
  const Icon = kind === "phone" ? Phone : Mail;
  if (!href || !text) return null;

  return (
    <a
      href={href}
      className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="break-all">{text}</span>
    </a>
  );
}

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
    <div className="space-y-4 pb-10">
      <div className="space-y-2 px-1">
        <Link
          href="/contractors"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          {contractor.name}
        </h1>
      </div>

      <CardSection title="基本情報">
        <div className="space-y-4">
          <InfoItem
            icon={<Building2 className="h-4 w-4" />}
            label="協力会社名"
            value={contractor.name}
          />

          <InfoItem
            icon={<MapPin className="h-4 w-4" />}
            label="住所"
            value={
              contractor.postalCode || contractor.address ? (
                <>
                  {contractor.postalCode ? (
                    <span className="mr-2 text-sm text-slate-500">
                      〒{contractor.postalCode}
                    </span>
                  ) : null}
                  {contractor.address ?? ""}
                </>
              ) : (
                "—"
              )
            }
          />

          <InfoItem
            icon={<Phone className="h-4 w-4" />}
            label="電話番号"
            value={
              (() => {
                const href = toTelHref(contractor.phone);
                return href ? (
                  <a
                    href={href}
                    className="inline-flex max-w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 break-all hover:bg-slate-50"
                  >
                    <span>{contractor.phone}</span>
                  </a>
                ) : (
                  <span className="text-base text-slate-500">—</span>
                );
              })()
            }
          />

          <InfoItem
            icon={<Mail className="h-4 w-4" />}
            label="メールアドレス"
            value={
              (() => {
                const href = toMailHref(contractor.email);
                return href ? (
                  <a
                    href={href}
                    className="inline-flex max-w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 break-all hover:bg-slate-50"
                  >
                    <span>{contractor.email}</span>
                  </a>
                ) : (
                  <span className="text-base text-slate-500">—</span>
                );
              })()
            }
          />

          {contractor.contactPerson ? (
            <InfoItem
              label="旧：担当者（移行前）"
              value={contractor.contactPerson}
            />
          ) : null}
        </div>
      </CardSection>

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
          <div className="divide-y divide-slate-100">
            {contacts.map((c) => {
              const tel = toTelHref(c.phone);
              const mail = toMailHref(c.email);

              return (
                <div
                  key={c.id ?? `${c.name}-${c.email ?? ""}-${c.phone ?? ""}`}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {c.name || "（名前未入力）"}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {c.phone ? (
                      <ContactChip kind="phone" href={tel} text={c.phone} />
                    ) : null}
                    {c.email ? (
                      <ContactChip kind="mail" href={mail} text={c.email} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardSection>

      <Link
        href={`/contractors/${contractor.id}/edit`}
        className="fixed right-4 bottom-[calc(85px+env(safe-area-inset-bottom))] z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
        aria-label="編集する"
      >
        <Pencil className="h-5 w-5" />
        <span>編集する</span>
      </Link>
    </div>
  );
}