// apps/api/src/sites/sites.service.ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import type { Prisma } from "@prisma/client";

type SiteTabType    = "active" | "done";
type SiteSortType   = "asc" | "desc";
type SiteStatusType = "upcoming" | "active" | "completed";

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSiteDto) {
    const { contactIds, startDate, endDate, ...rest } = dto;

    return this.prisma.site.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate:   endDate   ? new Date(endDate)   : undefined,
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
    tab?:       string;       // "active" | "done"
    sortDate?:  string;       // "asc" | "desc"
    monthFrom?: string;       // "YYYY-MM"
    monthTo?:   string;       // "YYYY-MM"
    limit?:     number;
    offset?:    number;
  } = {}) {
    const { keyword, companyId, status, tab, sortDate, monthFrom, monthTo } = params;
    const limit  = Math.min(params.limit  ?? 20, 100);
    const offset = params.offset ?? 0;

    const today = new Date();
    const now   = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const andClauses: Prisma.SiteWhereInput[] = [];

    // ── バリデーション ──
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

    // ── キーワード（現場名・住所）──
    if (keyword?.trim()) {
      const kw = keyword.trim();
      andClauses.push({
        OR: [
          { name:    { contains: kw, mode: "insensitive" } },
          { address: { contains: kw, mode: "insensitive" } },
        ],
      });
    }

    // ── 元請会社 ──
    if (companyId) {
      andClauses.push({ companyId });
    }

    // ── tab（未完了 / 完了済）── tab が指定されている場合は status より優先
    if (tab === "active") {
      // 未完了 = upcoming（開始前）+ active（進行中）
      andClauses.push({
        OR: [
          // upcoming: 開始日が今日より後
          { startDate: { gt: now } },
          // active: 開始日が今日以前 かつ 終了日が今日以降またはnull
          {
            AND: [
              { startDate: { lte: now } },
              { OR: [{ endDate: { gte: now } }, { endDate: null }] },
            ],
          },
        ],
      });
    } else if (tab === "done") {
      // 完了済 = 終了日が今日より前
      andClauses.push({ endDate: { lt: now } });
    } else if (status) {
      // tab 未指定時は従来の status パラメータにフォールバック
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

    // ── 期間絞り込み（startDate 基準・月単位）──
    if (monthFrom) {
      const from = new Date(`${monthFrom}-01T00:00:00`);
      andClauses.push({ startDate: { gte: from } });
    }
    if (monthTo) {
      const [y, m] = monthTo.split("-").map(Number);
      const to = new Date(y, m, 0, 23, 59, 59, 999); // 月末日
      andClauses.push({ startDate: { lte: to } });
    }

    const where: Prisma.SiteWhereInput = andClauses.length ? { AND: andClauses } : {};

    // ── ソート（startDate 基準 + secondary: createdAt）──
    const order: Prisma.SortOrder = sortDate === "asc" ? "asc" : "desc";

    // ── 件数と一覧を並列取得 ──
    const [total, sites] = await Promise.all([
      this.prisma.site.count({ where }),
      this.prisma.site.findMany({
        where,
        orderBy: [
          { startDate: order },
          { createdAt: "desc" }, // 同日の並びを安定させる
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
    const { contactIds, startDate, endDate, ...siteFields } = dto;

    await this.ensureExists(id);

    return this.prisma.site.update({
      where: { id },
      data: {
        ...siteFields,
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

  async findSchedulesBySiteId(siteId: string, limit = 3) {
    return this.prisma.schedule.findMany({
      where: { siteId },
      orderBy: { date: "asc" },
      take: limit,
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        contractors: {
          include: { contractor: { select: { id: true, name: true } } },
        },
        employees: {
          include: { employee: { select: { id: true, name: true } } },
        },
      },
    });
  }
}
