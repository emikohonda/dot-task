// apps/api/src/sites/sites.service.ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import { Prisma } from "@prisma/client";

type SiteTabType    = "active" | "done";
type SiteSortType   = "asc" | "desc";
type SiteStatusType = "upcoming" | "active" | "completed";

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------
  // 仮 organizationId 取得
  // --------------------------------
  private async getTemporaryOrganizationId() {
    const organization = await this.prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!organization) {
      throw new BadRequestException("Organization not found");
    }
    return organization.id;
  }

  // --------------------------------
  // 取引先（Company）解決ヘルパー
  // organizationId 対応版
  // --------------------------------
  private async resolveCompanyId(
    organizationId: string,
    companyId?: string | null,
    companyNameToCreate?: string | null,
  ): Promise<string | null> {
    if (companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: companyId, organizationId },
        select: { id: true },
      });
      if (!company) {
        throw new BadRequestException("Company not found in this organization");
      }
      return company.id;
    }

    const name = companyNameToCreate?.trim();
    if (!name) return null;

    const existing = await this.prisma.company.findFirst({
      where: { organizationId, name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.company.create({
      data: { organizationId, name },
      select: { id: true },
    });
    return created.id;
  }

  // --------------------------------
  // contactIds バリデーション
  // 同じ organizationId の CompanyContact か確認
  // --------------------------------
  private async validateContactIds(
    organizationId: string,
    contactIds: string[],
  ): Promise<void> {
    if (!contactIds.length) return;

    const found = await this.prisma.companyContact.findMany({
      where: {
        id: { in: contactIds },
        company: { organizationId },
      },
      select: { id: true },
    });

    if (found.length !== contactIds.length) {
      throw new BadRequestException(
        "指定された担当者の一部がこの組織に存在しません",
      );
    }
  }

  async create(dto: CreateSiteDto) {
    const organizationId = await this.getTemporaryOrganizationId();
    const { contactIds, startDate, endDate, color, companyNameToCreate, ...rest } = dto;

    const resolvedCompanyId = await this.resolveCompanyId(
      organizationId,
      rest.companyId ?? null,
      companyNameToCreate ?? null,
    );

    if (contactIds?.length) {
      await this.validateContactIds(organizationId, contactIds);
    }

    return this.prisma.site.create({
      data: {
        ...rest,
        organizationId,
        companyId: resolvedCompanyId,
        color: color ?? "sky",
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ...(contactIds?.length
          ? {
              companyContacts: {
                createMany: {
                  data: contactIds.map((id) => ({ companyContactId: id })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
    });
  }

  async findAll(params: {
    keyword?:   string;
    companyId?: string;
    status?:    string;
    tab?:       string;
    sortDate?:  string;
    monthFrom?: string;
    monthTo?:   string;
    limit?:     number;
    offset?:    number;
  } = {}) {
    const organizationId = await this.getTemporaryOrganizationId();
    const { keyword, companyId, status, tab, sortDate, monthFrom, monthTo } = params;
    const limit  = Math.min(params.limit  ?? 20, 100);
    const offset = params.offset ?? 0;

    const today = new Date();
    const now   = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const andClauses: Prisma.SiteWhereInput[] = [
      { organizationId },
    ];

    const validTabs:     SiteTabType[]    = ["active", "done"];
    const validSorts:    SiteSortType[]   = ["asc", "desc"];
    const validStatuses: SiteStatusType[] = ["upcoming", "active", "completed"];
    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

    if (tab && !validTabs.includes(tab as SiteTabType)) {
      throw new BadRequestException("tab must be one of active, done");
    }
    if (sortDate && !validSorts.includes(sortDate as SiteSortType)) {
      throw new BadRequestException("sortDate must be one of asc, desc");
    }
    if (status && !validStatuses.includes(status as SiteStatusType)) {
      throw new BadRequestException("status must be one of upcoming, active, completed");
    }
    if (monthFrom && !monthPattern.test(monthFrom)) {
      throw new BadRequestException("monthFrom must be in YYYY-MM format");
    }
    if (monthTo && !monthPattern.test(monthTo)) {
      throw new BadRequestException("monthTo must be in YYYY-MM format");
    }
    if (monthFrom && monthTo && monthFrom > monthTo) {
      throw new BadRequestException("monthFrom must be earlier than or equal to monthTo");
    }

    if (keyword?.trim()) {
      const kw = keyword.trim();
      andClauses.push({
        OR: [
          { name:    { contains: kw, mode: "insensitive" } },
          { address: { contains: kw, mode: "insensitive" } },
        ],
      });
    }

    if (companyId) {
      andClauses.push({ companyId });
    }

    if (tab === "active") {
      andClauses.push({
        OR: [
          { AND: [{ startDate: null }, { endDate: null }] },
          { startDate: { gt: now } },
          {
            AND: [
              { startDate: { lte: now } },
              { OR: [{ endDate: { gte: now } }, { endDate: null }] },
            ],
          },
        ],
      });
    } else if (tab === "done") {
      andClauses.push({ endDate: { lt: now } });
    } else if (status) {
      if (status === "upcoming") {
        andClauses.push({ startDate: { gt: now } });
      } else if (status === "active") {
        andClauses.push({
          AND: [
            { startDate: { lte: now } },
            { OR: [{ endDate: { gte: now } }, { endDate: null }] },
          ],
        });
      } else if (status === "completed") {
        andClauses.push({ endDate: { lt: now } });
      }
    }

    if (monthFrom) {
      const from = new Date(`${monthFrom}-01T00:00:00`);
      andClauses.push({ OR: [{ endDate: { gte: from } }, { endDate: null }] });
    }
    if (monthTo) {
      const [y, m] = monthTo.split("-").map(Number);
      const to = new Date(y, m, 0, 23, 59, 59, 999);
      andClauses.push({ endDate: { lte: to } });
    }

    const where: Prisma.SiteWhereInput = { AND: andClauses };
    const order: Prisma.SortOrder = sortDate === "asc" ? "asc" : "desc";

    const [total, sites] = await Promise.all([
      this.prisma.site.count({ where }),
      this.prisma.site.findMany({
        where,
        orderBy: [{ startDate: order }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
        include: {
          company: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      items: sites.map((site) => ({
        ...site,
        companyName: site.company?.name ?? null,
      })),
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string) {
    const organizationId = await this.getTemporaryOrganizationId();

    const site = await this.prisma.site.findFirst({
      where: { id, organizationId },
      include: {
        company: { select: { id: true, name: true } },
        companyContacts: {
          include: {
            companyContact: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
        contractors: {
          include: { contractor: { select: { id: true, name: true } } },
        },
        schedules: {
          orderBy: { date: "asc" },
          include: {
            employees: {
              include: { employee: { select: { id: true, name: true } } },
            },
            contractors: {
              include: { contractor: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!site) throw new NotFoundException("Site not found");
    return site;
  }

  async update(id: string, dto: UpdateSiteDto) {
    const organizationId = await this.getTemporaryOrganizationId();
    await this.ensureExists(id, organizationId);

    const { contactIds, startDate, endDate, color, companyNameToCreate, ...siteFields } = dto;

    const shouldResolveCompany =
      siteFields.companyId !== undefined || companyNameToCreate !== undefined;

    const resolvedCompanyId = shouldResolveCompany
      ? await this.resolveCompanyId(
          organizationId,
          siteFields.companyId ?? null,
          companyNameToCreate ?? null,
        )
      : undefined;

    if (contactIds?.length) {
      await this.validateContactIds(organizationId, contactIds);
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        ...siteFields,
        ...(shouldResolveCompany ? { companyId: resolvedCompanyId } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(contactIds !== undefined
          ? {
              companyContacts: {
                deleteMany: {},
                ...(contactIds.length
                  ? {
                      createMany: {
                        data: contactIds.map((cid) => ({ companyContactId: cid })),
                        skipDuplicates: true,
                      },
                    }
                  : {}),
              },
            }
          : {}),
      },
    });
  }

  async remove(id: string) {
    const organizationId = await this.getTemporaryOrganizationId();
    await this.ensureExists(id, organizationId);

    const scheduleCount = await this.prisma.schedule.count({ where: { siteId: id } });
    if (scheduleCount > 0) {
      throw new BadRequestException(
        "この現場には予定が登録されているため削除できません。先に予定を削除してください。",
      );
    }

    const workRecordCount = await this.prisma.workRecord.count({ where: { siteId: id } });
    if (workRecordCount > 0) {
      throw new BadRequestException(
        "この現場には作業記録が登録されているため削除できません。",
      );
    }

    const invoiceCount = await this.prisma.invoice.count({ where: { siteId: id } });
    if (invoiceCount > 0) {
      throw new BadRequestException(
        "この現場には請求書が登録されているため削除できません。",
      );
    }

    return this.prisma.site.delete({ where: { id } });
  }

  private async ensureExists(id: string, organizationId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!site) throw new NotFoundException("Site not found");
  }

  async findSchedulesBySiteId(siteId: string, limit = 3) {
    const organizationId = await this.getTemporaryOrganizationId();
    await this.ensureExists(siteId, organizationId);

    const where: Prisma.ScheduleWhereInput = {
      siteId,
      organizationId,
    };

    const [total, items] = await Promise.all([
      this.prisma.schedule.count({ where }),
      this.prisma.schedule.findMany({
        where,
        orderBy: [{ date: "asc" }, { startTime: "asc" }, { createdAt: "desc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          date: true,
          startTime: true,
          endTime: true,
          contractors: {
            include: { contractor: { select: { id: true, name: true } } },
          },
          employees: {
            include: { employee: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);
    return { items, total };
  }
}