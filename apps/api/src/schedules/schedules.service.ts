import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ScheduleStatus } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit: number) {
    const take = Math.min(limit ?? 100, 200);
    return this.prisma.schedule.findMany({
      take,
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
      include: {
        site: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async create(input: { title: string; date: string; siteId: string }) {
    const title = input.title?.trim();
    if (!title) {
      throw new BadRequestException('title is required');
    }

    const dateObj = new Date(input.date);
    if (Number.isNaN(dateObj.getTime())) {
      throw new BadRequestException('date must be ISO8601 string');
    }

    const site = await this.prisma.site.findUnique({
      where: { id: input.siteId },
    });
    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return this.prisma.schedule.create({
      data: {
        title,
        date: dateObj,
        siteId: input.siteId,
        status: 'TODO',
      },
      include: {
        site: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    input: { title?: string; date?: string; siteId?: string }
  ) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Schedule not found');
    }

    // siteId が来たときだけ存在チェック
    if (input.siteId) {
      const site = await this.prisma.site.findUnique({
        where: { id: input.siteId },
      });
      if (!site) {
        throw new NotFoundException('Site not found');
      }
    }

    // date が来たときだけチェック（壊れてるISO対策）
    const dateObj =
      input.date !== undefined ? new Date(input.date) : undefined;
    if (dateObj && Number.isNaN(dateObj.getTime())) {
      throw new BadRequestException('date must be ISO8601 string');
    }

    // title が来たときだけ trim + 空対策
    const title =
      input.title !== undefined ? input.title.trim() : undefined;
    if (input.title !== undefined && !title) {
      throw new BadRequestException('title must not be empty');
    }

    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(dateObj !== undefined ? { date: dateObj } : {}),
        ...(input.siteId !== undefined ? { siteId: input.siteId } : {}),
      },
      include: {
        site: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(id: string, status: ScheduleStatus) {
    const exists = await this.prisma.schedule.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.schedule.update({
      where: { id },
      data: { status },
      include: {
        site: { select: { id: true, name: true } },
        contractor: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.schedule.findUnique({ where: { id }});
    if (!exists) throw new NotFoundException('Schedule not found');

    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}