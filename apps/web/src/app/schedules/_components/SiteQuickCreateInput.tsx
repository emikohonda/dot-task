// apps/web/src/app/schedules/_components/SiteQuickCreateInput.tsx
"use client";

import QuickCreateSelect from "@/components/QuickCreateSelect";
import type { Site } from "@/lib/api";

type Props = {
  sites: Site[];
  siteId: string;
  siteNameToCreate: string;
  disabled?: boolean;
  error?: string;
  onChange: (value: { siteId: string; siteNameToCreate: string }) => void;
};

export default function SiteQuickCreateInput({
  sites,
  siteId,
  siteNameToCreate,
  disabled,
  error,
  onChange,
}: Props) {
  return (
    <QuickCreateSelect
      options={sites.map(({ id, name, startDate, endDate }) => ({
        id,
        name,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      }))}
      selectedId={siteId}
      nameToCreate={siteNameToCreate}
      disabled={disabled}
      error={error}
      placeholder="現場名を入力・検索"
      addLabel="現場として追加"
      emptyLabel="登録済みの現場がありません"
      showCompletedBadge
      onChange={({ selectedId, nameToCreate }) =>
        onChange({ siteId: selectedId, siteNameToCreate: nameToCreate })
      }
    />
  );
}