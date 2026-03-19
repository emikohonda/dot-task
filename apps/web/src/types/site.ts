// apps/web/src/types/site.ts
export type SiteDetail = {
  id: string;
  name: string;
  address: string | null;
  startDate: string | null;
  endDate: string | null;

  createdAt: string;
  updatedAt: string; // ← これを追加（or string | null）

  companyId: string | null;
  company: { id: string; name: string } | null;

  companyContacts?: Array<{
    companyContact: {
      id: string;
      name: string | null;
      phone: string | null;
      email: string | null;
    } | null;
  }>;
};