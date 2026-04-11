// apps/web/src/app/sites/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarX,
  Building2,
  MapPin,
  CalendarRange,
  Clock,
  Phone,
  Mail,
  Pencil,
} from "lucide-react";
import type { ReactNode } from "react";

import { CardSection } from "@/components/CardSection";
import { fetchSite, fetchSiteSchedules } from "@/lib/fetchers/sites";
import { formatScheduleTitle } from "@/lib/validations/scheduleSchemas";

// ── ユーティリティ ──

// スケジュール用（年月日＋曜日）← 今のformatDateをそのまま使う
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日（${weekday}）`;
}

// 期間用（スラッシュ形式＋曜日）
function formatDateSlash(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}(${weekday})`;
}

function formatPeriod(startDate: string | null | undefined, endDate: string | null | undefined) {
  const start = formatDateSlash(startDate);
  const end = formatDateSlash(endDate);
  if (!startDate && !endDate) return "—";
  if (startDate && !endDate) return `${start} ～`;
  if (!startDate && endDate) return `～ ${end}`;
  return `${start} ～ ${end}`;
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScheduleDateTime(
  dateStr: string | null | undefined,
  startTime?: string | null,
  endTime?: string | null
) {
  if (!dateStr) return "—";
  const dateLabel = formatDate(dateStr);
  if (startTime && endTime) return `${dateLabel} ${startTime}〜${endTime}`;
  if (startTime) return `${dateLabel} ${startTime}`;
  return `${dateLabel} 終日`;
}

// ── サブコンポーネント ──

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

  if (!href) return null;

  return (
    <a
      href={href}
      className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="truncate">{text}</span>
    </a>
  );
}

// ── メインページ ──

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
  if (!site) notFound();

  const { items: schedules, total: scheduleTotal } = await fetchSiteSchedules(id, 3);

  const contacts = (site.companyContacts ?? [])
    .map((x) => x.companyContact)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="space-y-4">
      {/* ── ヘッダー ── */}
      <div className="space-y-2 px-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ 一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          {site.name}
        </h1>
      </div>

      {/* ── 現場スケジュール（一番上に移動）── */}
      <CardSection
        title={`現場スケジュール（${scheduleTotal}件）`}
        right={
          <Link
            href={`/sites/${id}/schedules`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            すべて見る
          </Link>
        }
      >
        {schedules.length === 0 ? (
          <EmptySchedule />
        ) : (
          <ul className="divide-y divide-slate-100">
            {schedules.map((s) => (
              <li key={s.id} className="py-3">
                <Link
                  href={`/schedules/${s.id}`}
                  className="group block rounded-xl transition-colors hover:bg-slate-50/60"
                >
                  <p
                    className={[
                      "text-base group-hover:text-sky-600",
                      s.title?.trim()
                        ? "font-semibold text-slate-900"
                        : "font-normal text-slate-400",
                    ].join(" ")}
                  >
                    {formatScheduleTitle(s.title)}
                  </p>
                  {/* 日程・時間のみ表示 */}
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatScheduleDateTime(s.date, s.startTime, s.endTime)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardSection>

      {/* ── 基本情報 ── */}
      <CardSection title="基本情報">
        <div className="space-y-4">
          <InfoItem
            icon={<Building2 className="h-4 w-4" />}
            label="元請会社"
            value={site.company?.name ?? "—"}
          />
          <InfoItem
            icon={<MapPin className="h-4 w-4" />}
            label="住所"
            value={site.address ?? "—"}
          />
          <InfoItem
            icon={<CalendarRange className="h-4 w-4" />}
            label="期間"
            value={formatPeriod(site.startDate, site.endDate)}
          />
          <InfoItem
            icon={<Clock className="h-4 w-4" />}
            label="最終更新"
            value={formatDateTime(site.updatedAt)}
          />
        </div>
      </CardSection>

      {/* ── 現場担当者（三重感解消・説明文削除）── */}
      <CardSection title="現場担当者">
        {contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">現場担当者が登録されていません。</p>
            <div className="mt-4">
              <Link
                href={`/sites/${id}/edit`}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                現場担当者を選択
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {contacts.map((c) => {
              const tel = toTelHref(c.phone);
              const mail = toMailHref(c.email);
              return (
                <div
                  key={c.id ?? `${c.name ?? ""}-${c.email ?? ""}-${c.phone ?? ""}`}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {c.name ?? "（名前未設定）"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.phone && <ContactChip kind="phone" href={tel} text={c.phone} />}
                    {c.email && <ContactChip kind="mail" href={mail} text={c.email} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardSection>

      {/* ── 右下固定の編集FAB ── */}
      <Link
        href={`/sites/${id}/edit`}
        className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
        aria-label="編集する"
      >
        <Pencil className="h-5 w-5" />
        <span>編集する</span>
      </Link>
    </div>
  );
}
