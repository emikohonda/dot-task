// apps/web/src/app/sites/_components/CompanyQuickCreateInput.tsx
"use client";

import QuickCreateSelect from "@/components/QuickCreateSelect";

export type CompanyOption = {
  id: string;
  name: string;
  contacts: Array<{
    id: string;
    name: string | null;
    phone?: string | null;
    email?: string | null;
  }>;
};

type Props = {
  companies: CompanyOption[];
  companyId: string;
  companyNameToCreate: string;
  disabled?: boolean;
  error?: string;
  onChange: (value: { companyId: string; companyNameToCreate: string }) => void;
};

export default function CompanyQuickCreateInput({
  companies,
  companyId,
  companyNameToCreate,
  disabled,
  error,
  onChange,
}: Props) {
  return (
    <QuickCreateSelect
      // contacts は QuickCreateSelect 側では不要なので id/name だけ渡す
      options={companies.map(({ id, name }) => ({ id, name }))}
      selectedId={companyId}
      nameToCreate={companyNameToCreate}
      disabled={disabled}
      error={error}
      placeholder="会社名を入力・検索"
      addLabel="元請会社として追加"
      emptyLabel="登録済みの元請会社がありません"
      onChange={({ selectedId, nameToCreate }) =>
        onChange({ companyId: selectedId, companyNameToCreate: nameToCreate })
      }
    />
  );
}
