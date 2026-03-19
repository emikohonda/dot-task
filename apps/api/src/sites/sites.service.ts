// apps/api/src/sites/sites.service.ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import type { Prisma } from "@prisma/client";

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSiteDto) {
    const { contactIds, startDate, endDate, ...rest } = dto;

    return this.prisma.site.create({
      data: {
        ...rest,
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
    keyword?: string;
    companyId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { keyword, companyId, status } = params;
    const limit  = Math.min(params.limit  ?? 20, 100);
    const offset = params.offset ?? 0;

    const where: Prisma.SiteWhereInput = {};

    // ── キーワード（現場名 / 住所）──
    if (keyword?.trim()) {
      const kw = keyword.trim();
      where.OR = [
        { name:    { contains: kw, mode: "insensitive" } },
        { address: { contains: kw, mode: "insensitive" } },
      ];
    }

    // ── 元請会社 ──
    if (companyId) {
      where.companyId = companyId;
    }

    // ── 進行状態（独自ステータス）──
    const VALID_SITE_STATUSES = ["upcoming", "active", "completed"] as const;
    if (status) {
      if (!VALID_SITE_STATUSES.includes(status as (typeof VALID_SITE_STATUSES)[number])) {
        throw new BadRequestException("status must be one of upcoming, active, completed");
      }
      // 日単位比較（時刻を除いた今日の 00:00）
      const today = new Date();
      const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (status === "upcoming") {
        // 未着工：開始日が今日より後
        where.startDate = { gt: now };
      } else if (status === "active") {
        // 進行中：開始日が今日以前 かつ 終了日が今日以降またはnull
        // ※日付未設定の現場はフィルタ対象外（B方針）
        where.AND = [
          { startDate: { lte: now } },
          { OR: [{ endDate: { gte: now } }, { endDate: null }] },
        ];
      } else if (status === "completed") {
        // 完了：終了日が今日より前
        where.endDate = { lt: now };
      }
    }

    // ── 件数と一覧を並列取得 ──
    const [total, sites] = await Promise.all([
      this.prisma.site.count({ where }),
      this.prisma.site.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          company: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      items: sites.map((s) => ({
        ...s,
        companyName: s.company?.name ?? null,
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
                        data: contactIds.map((cid) => ({
                          companyContactId: cid,
                        })),
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
