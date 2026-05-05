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
  // 取引先（Company）解決ヘルパー
  // companyId があればそれを優先
  // なければ companyNameToCreate で既存検索 or 新規作成
  // --------------------------------
  private async resolveCompanyId(
    companyId?: string | null,
    companyNameToCreate?: string | null,
  ): Promise<string | null> {
    // 1. 既存IDがあれば優先してそのまま返す
    if (companyId) return companyId;

    // 2. 新規会社名を trim して空なら null
    const name = companyNameToCreate?.trim();
    if (!name) return null;

    // 3. 完全一致する既存 company があればそのIDを返す
    const existing = await this.prisma.company.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    // 4. なければ name だけで新規作成
    const created = await this.prisma.company.create({
      data: { name },
      select: { id: true },
    });
    return created.id;
  }

  async create(dto: CreateSiteDto) {
    const { contactIds, startDate, endDate, color, companyNameToCreate, ...rest } = dto;

    // companyId または companyNameToCreate から companyId を解決
    const resolvedCompanyId = await this.resolveCompanyId(
      rest.companyId ?? null,
      companyNameToCreate ?? null,
    );

    return this.prisma.site.create({
      data: {
        ...rest,
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
    const { keyword, companyId, status, tab, sortDate, monthFrom, monthTo } = params;
    const limit  = Math.min(params.limit  ?? 20, 100);
    const offset = params.offset ?? 0;

    const today = new Date();
    const now   = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const andClauses: Prisma.SiteWhereInput[] = [];

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
      andClauses.push({
        OR: [
          { endDate: { gte: from } },
          { endDate: null },
        ],
      });
    }
    if (monthTo) {
      const [y, m] = monthTo.split("-").map(Number);
      const to = new Date(y, m, 0, 23, 59, 59, 999);
      andClauses.push({ endDate: { lte: to } });
    }

    const where: Prisma.SiteWhereInput = andClauses.length ? { AND: andClauses } : {};
    const order: Prisma.SortOrder = sortDate === "asc" ? "asc" : "desc";

    const [total, sites] = await Promise.all([
      this.prisma.site.count({ where }),
      this.prisma.site.findMany({
        where,
        orderBy: [
          { startDate: order },
          { createdAt: "desc" },
        ],
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
    const site = await this.prisma.site.findUnique({
      where: { id },
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
    const { contactIds, startDate, endDate, color, companyNameToCreate, ...siteFields } = dto;

    await this.ensureExists(id);

    // companyId か companyNameToCreate が送られてきた時だけ解決する
    // （編集時に会社欄を触っていない場合は companyId が undefined → 変更しない）
    const shouldResolveCompany =
      siteFields.companyId !== undefined || companyNameToCreate !== undefined;

    const resolvedCompanyId = shouldResolveCompany
      ? await this.resolveCompanyId(
          siteFields.companyId ?? null,
          companyNameToCreate ?? null,
        )
      : undefined;

    return this.prisma.site.update({
      where: { id },
      data: {
        ...siteFields,
        // 会社解決結果を上書き（触っていない場合は undefined = 変更なし）
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
    await this.ensureExists(id);

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

  private async ensureExists(id: string) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException("Site not found");
  }

  async findSchedulesBySiteId(
    siteId: string,
    limit = 3,
  ) {
    const where: Prisma.ScheduleWhereInput = {
      siteId,
    };

    const [total, items] = await Promise.all([
      this.prisma.schedule.count({ where }),
      this.prisma.schedule.findMany({
        where,
        orderBy: [
          { date: "asc" },
          { startTime: "asc" },
          { createdAt: "desc" },
        ],
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
