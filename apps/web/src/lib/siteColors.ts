// apps/web/src/lib/siteColors.ts

export const SITE_COLOR_KEYS = [
  "sky",
  "blue",
  "cyan",
  "emerald",
  "green",
  "lime",
  "amber",
  "orange",
  "rose",
  "pink",
  "violet",
  "slate",
] as const;

export type SiteColorKey = (typeof SITE_COLOR_KEYS)[number];

export const siteColorLabels: Record<SiteColorKey, string> = {
  sky: "空色",
  blue: "青",
  cyan: "水色",
  emerald: "エメラルド",
  green: "緑",
  lime: "黄緑",
  amber: "黄",
  orange: "オレンジ",
  rose: "赤",
  pink: "ピンク",
  violet: "紫",
  slate: "グレー",
};

export const siteColorMap: Record<
  SiteColorKey,
  {
    chip: string;
    bar: string;
    text: string;
    dot: string;
    border: string;
    bgSoft: string;
  }
> = {
  sky: {
    chip: "bg-sky-100 text-sky-800 border-sky-200",
    bar: "bg-sky-500",
    text: "text-sky-700",
    dot: "bg-sky-500",
    border: "border-sky-300",
    bgSoft: "bg-sky-50",
  },
  blue: {
    chip: "bg-blue-100 text-blue-800 border-blue-200",
    bar: "bg-blue-500",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-300",
    bgSoft: "bg-blue-50",
  },
  cyan: {
    chip: "bg-cyan-100 text-cyan-800 border-cyan-200",
    bar: "bg-cyan-500",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
    border: "border-cyan-300",
    bgSoft: "bg-cyan-50",
  },
  emerald: {
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-300",
    bgSoft: "bg-emerald-50",
  },
  green: {
    chip: "bg-green-100 text-green-800 border-green-200",
    bar: "bg-green-500",
    text: "text-green-700",
    dot: "bg-green-500",
    border: "border-green-300",
    bgSoft: "bg-green-50",
  },
  lime: {
    chip: "bg-lime-100 text-lime-800 border-lime-200",
    bar: "bg-lime-500",
    text: "text-lime-700",
    dot: "bg-lime-500",
    border: "border-lime-300",
    bgSoft: "bg-lime-50",
  },
  amber: {
    chip: "bg-amber-100 text-amber-800 border-amber-200",
    bar: "bg-amber-500",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-300",
    bgSoft: "bg-amber-50",
  },
  orange: {
    chip: "bg-orange-100 text-orange-800 border-orange-200",
    bar: "bg-orange-500",
    text: "text-orange-700",
    dot: "bg-orange-500",
    border: "border-orange-300",
    bgSoft: "bg-orange-50",
  },
  rose: {
    chip: "bg-rose-100 text-rose-800 border-rose-200",
    bar: "bg-rose-500",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-300",
    bgSoft: "bg-rose-50",
  },
  pink: {
    chip: "bg-pink-100 text-pink-800 border-pink-200",
    bar: "bg-pink-500",
    text: "text-pink-700",
    dot: "bg-pink-500",
    border: "border-pink-300",
    bgSoft: "bg-pink-50",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800 border-violet-200",
    bar: "bg-violet-500",
    text: "text-violet-700",
    dot: "bg-violet-500",
    border: "border-violet-300",
    bgSoft: "bg-violet-50",
  },
  slate: {
    chip: "bg-slate-100 text-slate-800 border-slate-200",
    bar: "bg-slate-500",
    text: "text-slate-700",
    dot: "bg-slate-500",
    border: "border-slate-300",
    bgSoft: "bg-slate-50",
  },
};

export function getSiteColor(color?: string | null) {
  if (SITE_COLOR_KEYS.includes(color as SiteColorKey)) {
    return siteColorMap[color as SiteColorKey];
  }

  return siteColorMap.sky;
}

export function getSiteColorLabel(color?: string | null) {
  if (SITE_COLOR_KEYS.includes(color as SiteColorKey)) {
    return siteColorLabels[color as SiteColorKey];
  }

  return siteColorLabels.sky;
}