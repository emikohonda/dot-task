import type { OrgRole } from '@prisma/client';

export type AuthMembership = {
  organizationId: string;
  role: OrgRole;
};
