// apps/api/src/schedules/schedules.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

function isValidHm(s: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return false;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

const VALID_TABS = ['active', 'done'] as const;
const VALID_SORTS = ['asc', 'desc'] as const;

function assertValidYmd(value: string, fieldName: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${fieldName} must be YYYY-MM-DD`);
  }
  const [y, m, d] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }
}

function ymdToUtcDate(value: string, fieldName: string): Date {
  assertValidYmd(value, fieldName);
  return new Date(`${value}T00:00:00.000Z`);
}

function getTodayJstUtcDate(): Date {
  const ymd = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return ymdToUtcDate(ymd, 'today');
}

function buildOverlapConditions(
  rangeStart: Date | null,
  rangeEnd: Date | null,
): Prisma.ScheduleWhereInput[] {
  const conditions: Prisma.ScheduleWhereInput[] = [];
  if (rangeEnd) {
    conditions.push({ date: { lte: rangeEnd } });
  }
  if (rangeStart) {
    conditions.push({
      OR: [
        { endDate: { gte: rangeStart } },
        { endDate: null, date: { gte: rangeStart } },
      ],
    });
  }
  return conditions;
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) { }

  private includeForScheduleList() {
    return {
      site: {
        select: {
          id: true,
          name: true,
          color: true,
          company: { select: { id: true, name: true } },
        },
      },
    } as const;
  }

  private includeForScheduleDetail() {
    return {
      site: {
        select: {
          id: true,
          name: true,
          color: true,
          company: { select: { id: true, name: true } },
        },
      },
      contractors: { include: { contractor: { select: { id: true, name: true } } } },
      employees: { include: { employee: { select: { id: true, name: true } } } },
    } as const;
  }

  // --------------------------------
  // 外注先解決ヘルパー（organizationId対応）
  // --------------------------------
  private async resolveContractorIds(params: {
    organizationId: string;
    contractorIds: string[];
    contractorNamesToCreate: string[];
  }): Promise<string[]> {
    const baseIds = uniq(params.contractorIds).filter(Boolean);

    if (baseIds.length) {
      const found = await this.prisma.contractor.findMany({
        where: { id: { in: baseIds }, organizationId: params.organizationId },
        select: { id: true },
      });
      if (found.length !== baseIds.length) {
        throw new NotFoundException('Contractor not found');
      }
    }

    const uniqueNames = uniq(
      params.contractorNamesToCreate.map((n) => n.trim()).filter((n) => n.length > 0),
    );

    if (!uniqueNames.length) return baseIds;

    const resolvedIds = [...baseIds];

    for (const name of uniqueNames) {
      const existing = await this.prisma.contractor.findFirst({
        where: { organizationId: params.organizationId, name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });

      if (existing) {
        if (!resolvedIds.includes(existing.id)) resolvedIds.push(existing.id);
        continue;
      }

      const created = await this.prisma.contractor.create({
        data: { organizationId: params.organizationId, name },
        select: { id: true },
      });
      resolvedIds.push(created.id);
    }

    return uniq(resolvedIds);
  }

  // --------------------------------
  // 社員解決ヘルパー（organizationId対応）
  // --------------------------------
  private async resolveEmployeeIds(params: {
    organizationId: string;
    employeeIds: string[];
    employeeNamesToCreate: string[];
  }): Promise<string[]> {
    const baseIds = uniq(params.employeeIds).filter(Boolean);

    if (baseIds.length) {
      const found = await this.prisma.employee.findMany({
        where: { id: { in: baseIds }, organizationId: params.organizationId },
        select: { id: true },
      });

      if (found.length !== baseIds.length) {
        throw new NotFoundException('Employee not found');
      }
    }

    const uniqueNames = uniq(
      params.employeeNamesToCreate
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    );

    if (!uniqueNames.length) return baseIds;

    const resolvedIds = [...baseIds];

    for (const name of uniqueNames) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          organizationId: params.organizationId,
          name: { equals: name, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (existing) {
        if (!resolvedIds.includes(existing.id)) resolvedIds.push(existing.id);
        continue;
      }

      const created = await this.prisma.employee.create({
        data: {
          organizationId: params.organizationId,
          name,
        },
        select: { id: true },
      });

      resolvedIds.push(created.id);
    }

    return uniq(resolvedIds);
  }

  // --------------------------------
  // 現場解決ヘルパー（organizationId対応）
  // --------------------------------
  private async resolveSiteId(params: {
    organizationId: string;
    siteId?: string | null;
    siteNameToCreate?: string | null;
  }): Promise<string> {
    if (params.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: params.siteId, organizationId: params.organizationId },
        select: { id: true },
      });
      if (!site) throw new NotFoundException('Site not found');
      return site.id;
    }

    const name = params.siteNameToCreate?.trim();
    if (!name) throw new BadRequestException('siteId or siteNameToCreate is required');

    const existing = await this.prisma.site.findFirst({
      where: { organizationId: params.organizationId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.site.create({
      data: { organizationId: params.organizationId, name },
      select: { id: true },
    });
    return created.id;
  }

  async findAll(
    organizationId: string,
    params: {
      limit?: number;
      offset?: number;
      date?: string;
      keyword?: string;
      tab?: string;
      sortDate?: string;
      dateFrom?: string;
      dateTo?: string;
      siteId?: string;
      employeeId?: string;
      contractorId?: string;
    },
  ) {
    const { date, keyword, tab, sortDate, dateFrom, dateTo, siteId, employeeId, contractorId } = params;

    const limit = Math.min(params.limit ?? 20, 200);
    const offset = params.offset ?? 0;

    if (tab && !VALID_TABS.includes(tab as (typeof VALID_TABS)[number])) {
      throw new BadRequestException(`tab must be one of ${VALID_TABS.join(', ')}`);
    }
    if (sortDate && !VALID_SORTS.includes(sortDate as (typeof VALID_SORTS)[number])) {
      throw new BadRequestException(`sortDate must be one of ${VALID_SORTS.join(', ')}`);
    }
    if (date && (dateFrom || dateTo)) {
      throw new BadRequestException('date cannot be combined with dateFrom/dateTo');
    }

    const where: Prisma.ScheduleWhereInput = { organizationId };
    const andConditions: Prisma.ScheduleWhereInput[] = [];

    if (date) {
      const rangeStart = ymdToUtcDate(date, 'date');
      const rangeEnd = new Date(`${date}T23:59:59.999Z`);
      andConditions.push(...buildOverlapConditions(rangeStart, rangeEnd));
    }

    if (dateFrom || dateTo) {
      if (dateFrom) assertValidYmd(dateFrom, 'dateFrom');
      if (dateTo) assertValidYmd(dateTo, 'dateTo');
      if (dateFrom && dateTo && dateFrom > dateTo) {
        throw new BadRequestException('dateFrom must be on or before dateTo');
      }
      const rangeStart = dateFrom ? ymdToUtcDate(dateFrom, 'dateFrom') : null;
      const rangeEnd = dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : null;
      andConditions.push(...buildOverlapConditions(rangeStart, rangeEnd));
    }

    if (tab === 'active') {
      const today = getTodayJstUtcDate();
      andConditions.push({
        OR: [
          { endDate: { gte: today } },
          { endDate: null, date: { gte: today } },
        ],
      });
    }

    if (tab === 'done') {
      const today = getTodayJstUtcDate();
      andConditions.push({
        OR: [
          { endDate: { lt: today } },
          { endDate: null, date: { lt: today } },
        ],
      });
    }

    if (andConditions.length) where.AND = andConditions;

    if (keyword?.trim()) {
      const kw = keyword.trim();
      where.OR = [
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
        { site: { is: { name: { contains: kw, mode: 'insensitive' } } } },
      ];
    }

    if (siteId) where.siteId = siteId;
    if (employeeId) where.employees = { some: { employeeId } };
    if (contractorId) where.contractors = { some: { contractorId } };

    const dateOrder = sortDate === 'desc' ? 'desc' : 'asc';
    const orderBy: Prisma.ScheduleOrderByWithRelationInput[] = [
      { date: dateOrder },
      { startTime: 'asc' },
      { createdAt: 'desc' },
    ];

    if (date) {
      const items = await this.prisma.schedule.findMany({
        where,
        orderBy,
        include: this.includeForScheduleDetail(),
      });
      return { items, total: items.length, limit: items.length, offset: 0 };
    }

    const [total, items] = await Promise.all([
      this.prisma.schedule.count({ where }),
      this.prisma.schedule.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: this.includeForScheduleList(),
      }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(organizationId: string, id: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, organizationId },
      include: this.includeForScheduleDetail(),
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async create(
    organizationId: string,
    input: {
      title?: string;
      date: string;
      endDate?: string | null;
      siteId?: string | null;
      siteNameToCreate?: string | null;
      contractorIds?: string[];
      contractorNamesToCreate?: string[];
      employeeIds?: string[];
      employeeNamesToCreate?: string[];
      description?: string | null;
      startTime?: string | null;
      endTime?: string | null;
    },
  ) {
    const title = input.title?.trim() ?? '';

    const dateObj = ymdToUtcDate(input.date, 'date');

    let endDateObj: Date | null = null;
    if (input.endDate) {
      endDateObj = ymdToUtcDate(input.endDate, 'endDate');
      if (endDateObj < dateObj) {
        throw new BadRequestException('endDate must be on or after date');
      }
    }

    const resolvedSiteId = await this.resolveSiteId({
      organizationId,
      siteId: input.siteId ?? null,
      siteNameToCreate: input.siteNameToCreate ?? null,
    });

    const employeeIds = await this.resolveEmployeeIds({
      organizationId,
      employeeIds: input.employeeIds ?? [],
      employeeNamesToCreate: input.employeeNamesToCreate ?? [],
    });

    if (input.startTime && !isValidHm(input.startTime)) throw new BadRequestException('startTime must be HH:mm');
    if (input.endTime && !isValidHm(input.endTime)) throw new BadRequestException('endTime must be HH:mm');
    if ((input.startTime && !input.endTime) || (!input.startTime && input.endTime)) {
      throw new BadRequestException('startTime and endTime must be both set');
    }
    if (input.startTime && input.endTime && input.startTime > input.endTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const contractorIds = await this.resolveContractorIds({
      organizationId,
      contractorIds: input.contractorIds ?? [],
      contractorNamesToCreate: input.contractorNamesToCreate ?? [],
    });

    return this.prisma.schedule.create({
      data: {
        organizationId,
        title,
        date: dateObj,
        endDate: endDateObj,
        siteId: resolvedSiteId,
        description: input.description ?? null,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        ...(contractorIds.length ? {
          contractors: {
            createMany: {
              data: contractorIds.map((id) => ({ contractorId: id })),
              skipDuplicates: true,
            },
          },
        } : {}),
        ...(employeeIds.length ? {
          employees: {
            createMany: {
              data: employeeIds.map((id) => ({ employeeId: id })),
              skipDuplicates: true,
            },
          },
        } : {}),
      },
      include: this.includeForScheduleDetail(),
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: {
      title?: string;
      date?: string;
      endDate?: string | null;
      siteId?: string;
      siteNameToCreate?: string | null;
      contractorIds?: string[];
      contractorNamesToCreate?: string[];
      employeeIds?: string[];
      employeeNamesToCreate?: string[];
      description?: string | null;
      startTime?: string | null;
      endTime?: string | null;
    },
  ) {
    const exists = await this.prisma.schedule.findFirst({
      where: { id, organizationId },
      select: { id: true, startTime: true, endTime: true, date: true, endDate: true },
    });
    if (!exists) throw new NotFoundException('Schedule not found');

    const shouldUpdateSite =
      input.siteId !== undefined || input.siteNameToCreate !== undefined;
    const resolvedSiteId = shouldUpdateSite
      ? await this.resolveSiteId({
        organizationId,
        siteId: input.siteId ?? null,
        siteNameToCreate: input.siteNameToCreate ?? null,
      })
      : undefined;

    const dateObj = input.date !== undefined ? ymdToUtcDate(input.date, 'date') : undefined;

    let endDateObj: Date | null | undefined = undefined;
    if (input.endDate !== undefined) {
      endDateObj = input.endDate ? ymdToUtcDate(input.endDate, 'endDate') : null;
    }

    const nextDate = dateObj ?? exists.date;
    const nextEndDate = endDateObj !== undefined ? endDateObj : exists.endDate;
    if (nextEndDate && nextEndDate < nextDate) {
      throw new BadRequestException('endDate must be on or after date');
    }

    const title = input.title !== undefined ? input.title.trim() : undefined;
    const nextStartTime = input.startTime !== undefined ? input.startTime : exists.startTime;
    const nextEndTime = input.endTime !== undefined ? input.endTime : exists.endTime;

    if (nextStartTime && !isValidHm(nextStartTime)) throw new BadRequestException('startTime must be HH:mm');
    if (nextEndTime && !isValidHm(nextEndTime)) throw new BadRequestException('endTime must be HH:mm');
    if ((nextStartTime && !nextEndTime) || (!nextStartTime && nextEndTime)) {
      throw new BadRequestException('startTime and endTime must be both set');
    }
    if (nextStartTime && nextEndTime && nextStartTime > nextEndTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    const shouldUpdateContractors =
      input.contractorIds !== undefined || input.contractorNamesToCreate !== undefined;

    const contractorIds = shouldUpdateContractors
      ? await this.resolveContractorIds({
        organizationId,
        contractorIds: input.contractorIds ?? [],
        contractorNamesToCreate: input.contractorNamesToCreate ?? [],
      })
      : undefined;

    const shouldUpdateEmployees =
      input.employeeIds !== undefined || input.employeeNamesToCreate !== undefined;

    const employeeIds = shouldUpdateEmployees
      ? await this.resolveEmployeeIds({
        organizationId,
        employeeIds: input.employeeIds ?? [],
        employeeNamesToCreate: input.employeeNamesToCreate ?? [],
      })
      : undefined;

    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(dateObj !== undefined ? { date: dateObj } : {}),
        ...(endDateObj !== undefined ? { endDate: endDateObj } : {}),
        ...(resolvedSiteId !== undefined ? { siteId: resolvedSiteId } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(contractorIds !== undefined ? {
          contractors: {
            deleteMany: {},
            ...(contractorIds.length ? {
              createMany: {
                data: contractorIds.map((cid) => ({ contractorId: cid })),
                skipDuplicates: true,
              },
            } : {}),
          },
        } : {}),
        ...(employeeIds !== undefined ? {
          employees: {
            deleteMany: {},
            ...(employeeIds.length ? {
              createMany: {
                data: employeeIds.map((eid) => ({ employeeId: eid })),
                skipDuplicates: true,
              },
            } : {}),
          },
        } : {}),
      },
      include: this.includeForScheduleDetail(),
    });
  }

  async remove(organizationId: string, id: string) {
    const exists = await this.prisma.schedule.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Schedule not found');
    return this.prisma.schedule.delete({ where: { id } });
  }
}