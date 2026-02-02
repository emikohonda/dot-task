// apps/api/src/sites/sites.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateSiteDto) {
    const { name, address, companyId, startDate, endDate } = data;

    // Prisma の @default(uuid()) の代わりに、自前で UUID を作る
    const id = randomUUID();

    const [site] = await this.prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO "sites" (
      "id",
      "name",
      "address",
      "companyId",
      "startDate",
      "endDate",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      '${id}',
      '${name}',
      ${address ? `'${address}'` : 'NULL'},
      ${companyId ? `'${companyId}'` : 'NULL'},
      ${startDate ? `'${startDate}'` : 'NULL'},
      ${endDate ? `'${endDate}'` : 'NULL'},
      NOW(),
      NOW()
    )
    RETURNING *;
  `);

    return site;
  }

  async findAll() {
    const sites = await this.prisma.$queryRawUnsafe<any[]>(`
    SELECT
      s.*,
      c.name AS "companyName"
    FROM "sites" AS s
    LEFT JOIN "companies" AS c
      ON s."companyId" = c.id
    ORDER BY s."createdAt" DESC
  `);

    return sites;
  }

  async findOne(id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        company: true,
        contractors: {
          include: {
            contractor: true,
          },
        },
        schedules: true,
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async update(id: string, data: UpdateSiteDto) {
    await this.ensureExists(id);

    return this.prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        companyId: data.companyId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.site.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }
  }

  //　現場の予定を取得（最大　limit　件）
  async findSchedulesBySiteId(siteId: string, limit = 3) {
    return this.prisma.schedule.findMany({
      where: { siteId },
      orderBy: { date: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        contractor: { select: { name: true } },
      },
    });
  }
}