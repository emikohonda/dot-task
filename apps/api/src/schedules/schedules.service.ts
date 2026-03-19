// apps/api/src/schedules/schedules.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, ScheduleStatus } from '@prisma/client';

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

const VALID_STATUSES: ScheduleStatus[] = ['TODO', 'DOING', 'HOLD', 'DONE', 'CANCELLED'];

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

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) { }

  private includeForSchedule() {
    return {
      site: { select: { id: true, name: true } },
      contractors: { include: { contractor: { select: { id: true, name: true } } } },
      employees: { include: { employee: { select: { id: true, name: true } } } },
    } as const;
  }

  async findAll(params: {
    limit?: number;
    offset?: number;
    date?: string;
    keyword?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    siteId?: string;
    employeeId?: string;
    contractorId?: string;
  }) {
    const {
      date, keyword, status, dateFrom, dateTo,
      siteId, employeeId, contractorId,
    } = params;

    const limit  = Math.min(params.limit  ?? 20, 200);
    const offset = params.offset ?? 0;

    const where: Prisma.ScheduleWhereInput = {};

    if (date && (dateFrom || dateTo)) {
      throw new BadRequestException('date cannot be combined with dateFrom/dateTo');
    }

    // ── 単日フィルタ（後方互換：朝礼DX用）──
    if (date) {
      assertValidYmd(date, 'date');
      where.date = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lte: new Date(`${date}T23:59:59.999Z`),
      };
    }

    // ── 日付範囲フィルタ ──
    if (dateFrom || dateTo) {
      if (dateFrom) assertValidYmd(dateFrom, 'dateFrom');
      if (dateTo)   assertValidYmd(dateTo,   'dateTo');
      if (dateFrom && dateTo && dateFrom > dateTo) {
        throw new BadRequestException('dateFrom must be on or before dateTo');
      }
      where.date = {
        ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
        ...(dateTo   ? { lte: new Date(`${dateTo}T23:59:59.999Z`) }   : {}),
      };
    }

    // ── キーワード ──
    if (keyword?.trim()) {
      const kw = keyword.trim();
      where.OR = [
        { title:       { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
        { site: { is: { name: { contains: kw, mode: 'insensitive' } } } },
      ];
    }

    // ── ステータス ──
    if (status) {
      if (!VALID_STATUSES.includes(status as ScheduleStatus)) {
        throw new BadRequestException(`status must be one of ${VALID_STATUSES.join(', ')}`);
      }
      where.status = status as ScheduleStatus;
    }

    if (siteId)       where.siteId      = siteId;
    if (employeeId)   where.employees   = { some: { employeeId } };
    if (contractorId) where.contractors = { some: { contractorId } };

    // ── 朝礼DX用（dateクエリあり）はpagination不要 ──
    if (date) {
      const items = await this.prisma.schedule.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { createdAt: 'desc' }],
        include: this.includeForSchedule(),
      });
      return { items, total: items.length, limit: items.length, offset: 0 };
    }

    // ── 通常一覧：pagination対応 ──
    const [total, items] = await Promise.all([
      this.prisma.schedule.count({ where }),
      this.prisma.schedule.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { createdAt: 'desc' }],
        include: this.includeForSchedule(),
      }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: this.includeForSchedule(),
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async create(input: {
    title: string;
    date: string;
    siteId: string;
    status?: ScheduleStatus;
    contractorIds?: string[];
    employeeIds?: string[];
    description?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  }) {
    const title = input.title?.trim();
    if (!title) throw new BadRequestException('title is required');

    const dateObj = new Date(input.date);
    if (Number.isNaN(dateObj.getTime())) {
      throw new BadRequestException('date must be ISO8601 string');
    }

    const site = await this.prisma.site.findUnique({ where: { id: input.siteId } });
    if (!site) throw new NotFoundException('Site not found');

    const contractorIds = uniq(input.contractorIds ?? []).filter(Boolean);
    const employeeIds = uniq(input.employeeIds ?? []).filter(Boolean);

    if (contractorIds.length) {
      const found = await this.prisma.contractor.findMany({ where: { id: { in: contractorIds } }, select: { id: true } });
      if (found.length !== contractorIds.length) throw new NotFoundException('Contractor not found');
    }
    if (employeeIds.length) {
      const found = await this.prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true } });
      if (found.length !== employeeIds.length) throw new NotFoundException('Employee not found');
    }

    if (input.startTime && !isValidHm(input.startTime)) throw new BadRequestException('startTime must be HH:mm');
    if (input.endTime   && !isValidHm(input.endTime))   throw new BadRequestException('endTime must be HH:mm');
    if ((input.startTime && !input.endTime) || (!input.startTime && input.endTime)) {
      throw new BadRequestException('startTime and endTime must be both set');
    }
    if (input.startTime && input.endTime && input.startTime > input.endTime) {
      throw new BadRequestException('endTime must be after startTime');
    }

    return this.prisma.schedule.create({
      data: {
        title,
        date: dateObj,
        siteId: input.siteId,
        status: input.status ?? 'TODO',
        description: input.description ?? null,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        ...(contractorIds.length ? { contractors: { createMany: { data: contractorIds.map((id) => ({ contractorId: id })), skipDuplicates: true } } } : {}),
        ...(employeeIds.length   ? { employees:   { createMany: { data: employeeIds.map((id)   => ({ employeeId:   id })), skipDuplicates: true } } } : {}),
      },
      include: this.includeForSchedule(),
    });
  }

  async update(id: string, input: {
    title?: string; date?: string; siteId?: string; status?: ScheduleStatus;
    contractorIds?: string[]; employeeIds?: string[];
    description?: string | null; startTime?: string | null; endTime?: string | null;
  }) {
    const exists = await this.prisma.schedule.findUnique({ where: { id }, select: { id: true, startTime: true, endTime: true } });
    if (!exists) throw new NotFoundException('Schedule not found');

    if (input.siteId !== undefined) {
      const site = await this.prisma.site.findUnique({ where: { id: input.siteId } });
      if (!site) throw new NotFoundException('Site not found');
    }

    const dateObj = input.date !== undefined ? new Date(input.date) : undefined;
    if (dateObj && Number.isNaN(dateObj.getTime())) throw new BadRequestException('date must be ISO8601 string');

    const title = input.title !== undefined ? input.title.trim() : undefined;
    if (input.title !== undefined && !title) throw new BadRequestException('title must not be empty');

    const nextStartTime = input.startTime !== undefined ? input.startTime : exists.startTime;
    const nextEndTime   = input.endTime   !== undefined ? input.endTime   : exists.endTime;

    if (nextStartTime && !isValidHm(nextStartTime)) throw new BadRequestException('startTime must be HH:mm');
    if (nextEndTime   && !isValidHm(nextEndTime))   throw new BadRequestException('endTime must be HH:mm');
    if ((nextStartTime && !nextEndTime) || (!nextStartTime && nextEndTime)) throw new BadRequestException('startTime and endTime must be both set');
    if (nextStartTime && nextEndTime && nextStartTime > nextEndTime) throw new BadRequestException('endTime must be after startTime');

    const contractorIds = input.contractorIds !== undefined ? uniq(input.contractorIds).filter(Boolean) : undefined;
    const employeeIds   = input.employeeIds   !== undefined ? uniq(input.employeeIds).filter(Boolean)   : undefined;

    if (contractorIds?.length) {
      const found = await this.prisma.contractor.findMany({ where: { id: { in: contractorIds } }, select: { id: true } });
      if (found.length !== contractorIds.length) throw new NotFoundException('Contractor not found');
    }
    if (employeeIds?.length) {
      const found = await this.prisma.employee.findMany({ where: { id: { in: employeeIds } }, select: { id: true } });
      if (found.length !== employeeIds.length) throw new NotFoundException('Employee not found');
    }

    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...(title     !== undefined ? { title }                     : {}),
        ...(dateObj   !== undefined ? { date: dateObj }             : {}),
        ...(input.siteId      !== undefined ? { siteId:      input.siteId }      : {}),
        ...(input.status      !== undefined ? { status:      input.status }      : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.startTime   !== undefined ? { startTime:   input.startTime }   : {}),
        ...(input.endTime     !== undefined ? { endTime:     input.endTime }     : {}),
        ...(contractorIds !== undefined ? { contractors: { deleteMany: {}, ...(contractorIds.length ? { createMany: { data: contractorIds.map((cid) => ({ contractorId: cid })), skipDuplicates: true } } : {}) } } : {}),
        ...(employeeIds   !== undefined ? { employees:   { deleteMany: {}, ...(employeeIds.length   ? { createMany: { data: employeeIds.map((eid)   => ({ employeeId:   eid })), skipDuplicates: true } } : {}) } } : {}),
      },
      include: this.includeForSchedule(),
    });
  }

  async updateStatus(id: string, status: ScheduleStatus) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    return this.prisma.schedule.update({ where: { id }, data: { status }, include: this.includeForSchedule() });
  }

  async remove(id: string) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Schedule not found');
    return this.prisma.schedule.delete({ where: { id } });
  }
}