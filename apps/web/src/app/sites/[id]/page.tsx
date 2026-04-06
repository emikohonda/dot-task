// apps/web/src/app/sites/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarX,
  Building2,
  MapPin,
  CalendarRange,
  CalendarClock,
  Phone,
  Mail,
} from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/PageHeader";
import { CardSection } from "@/components/CardSection";

import { fetchSite, fetchSiteSchedules } from "@/lib/fetchers/sites";
import { getStatusMeta } from "@/lib/status";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ScheduleStatus = "TODO" | "DOING" | "HOLD" | "DONE" | "CANCELLED";
const isScheduleStatus = (v: unknown): v is ScheduleStatus =>
  v === "TODO" || v === "DOING" || v === "HOLD" || v === "DONE" || v === "CANCELLED";

function EmptySchedule() {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
      <CalendarX className="h-6 w-6" />
      <p className="text-sm">予定はまだありません。</p>
      <p className="text-xs">予定を追加すると、ここに表示されます。</p>
    </div>
  );
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
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm text-slate-900">
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

  if (href) {
    return (
      <a
        href={href}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
      >
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="truncate">{text}</span>
      </a>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
      <Icon className="h-4 w-4 text-slate-400" />
      <span>—</span>
    </span>
  );
}

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  const sp = (await searchParams) ?? {};

  const backQuery = new URLSearchParams(
    Object.entries(sp).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((v) => [key, v] as [string, string])
        : value
          ? [[key, value]]
          : []
    )
  ).toString();

  const backHref = backQuery ? `/sites?${backQuery}` : "/sites";

  const site = await fetchSite(id);
  if (!site) return notFound();

  const schedules = await fetchSiteSchedules(id, 3);

  // 💡 万が一 companyContacts が undefined でも壊れないように
  const contacts = (site.companyContacts ?? [])
    .map((x) => x.companyContact)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="現場一覧"
        title={site.name}
        right={
          <div className="flex items-center gap-2">
            <Link
              href={`/sites/${id}/edit`}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              編集
            </Link>

            <Link
              href={backHref}
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
            <InfoItem
              icon={<Building2 className="h-4 w-4" />}
              label="元請会社"
              value={site.company?.name ?? "—"}
            />
          </div>

          <div className="sm:col-span-2">
            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="住所"
              value={site.address ?? "—"}
            />
          </div>

          <div className="sm:col-span-2">
            <InfoItem
              icon={<CalendarRange className="h-4 w-4" />}
              label="期間"
              value={
                <>
                  {formatDate(site.startDate)} ～ {formatDate(site.endDate)}
                </>
              }
            />
          </div>

          <InfoItem
            icon={<CalendarClock className="h-4 w-4" />}
            label="作成日"
            value={formatDate(site.createdAt)}
          />
          <InfoItem
            icon={<CalendarClock className="h-4 w-4" />}
            label="更新日"
            value={formatDate(site.updatedAt)}
          />
        </div>
      </CardSection>

      {/* 現場担当者 */}
      <CardSection title="担当者・現場監督">
        {contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">担当者が登録されていません</p>
            <p className="mt-1 text-sm text-slate-600">
              現場の編集で担当者を選択できます。
            </p>

            <div className="mt-4">
              <Link
                href={`/sites/${id}/edit`}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                編集で担当者を選ぶ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => {
              const tel = toTelHref(c.phone);
              const mail = toMailHref(c.email);

              return (
                <div
                  key={c.id ?? `${c.name ?? ""}-${c.email ?? ""}-${c.phone ?? ""}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {c.name ?? "（名前未設定）"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        連絡先をタップで電話・メールできます
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ContactChip kind="phone" href={tel} text={c.phone} />
                      <ContactChip kind="mail" href={mail} text={c.email} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardSection>

      {/* 予定 */}
      <CardSection>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">この現場の予定（最大３件）</h2>

          <Link href={`/sites/${id}/schedules`} className="text-xs font-medium text-sky-700 hover:underline">
            すべて見る ▶︎
          </Link>
        </div>

        {schedules.length === 0 ? (
          <EmptySchedule />
        ) : (
          <ul className="divide-y divide-slate-100">
            {schedules.map((s) => {
              const contractorNames =
                s.contractors
                  ?.map((x) => x.contractor?.name ?? null)
                  .filter((n): n is string => Boolean(n && n.trim())) ?? [];

              const contractorsText = contractorNames.length ? contractorNames.join(" / ") : "";

              const employeeNames =
                s.employees
                  ?.map((x) => x.employee?.name ?? null)
                  .filter((n): n is string => Boolean(n && n.trim())) ?? [];

              const employeesText = employeeNames.length ? employeeNames.join(" / ") : "";

              return (
                <li key={s.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{s.title}</p>
                      <p className="text-sm text-slate-600">
                        {formatDateTime(s.date)}
                        {contractorsText ? ` / 協力会社：${contractorsText}` : ""}
                        {employeesText ? ` / 社員：${employeesText}` : ""}
                      </p>
                    </div>

                    {/* ステータスは今のままでOK */}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardSection>
    </div>
  );
}