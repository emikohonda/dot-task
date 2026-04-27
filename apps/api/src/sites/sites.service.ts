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

  async create(dto: CreateSiteDto) {
    const { contactIds, startDate, endDate, color, ...rest } = dto;

    return this.prisma.site.create({
      data: {
        ...rest,
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
    const { contactIds, startDate, endDate, color, ...siteFields } = dto;

    await this.ensureExists(id);

    return this.prisma.site.update({
      where: { id },
      data: {
        ...siteFields,
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
