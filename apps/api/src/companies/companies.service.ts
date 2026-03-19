// apps/api/src/companies/companies.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const contacts = (dto.contacts ?? [])
      .map((c) => ({ name: c.name?.trim() || null, phone: c.phone?.trim() || null, email: c.email?.trim() || null }))
      .filter((c) => c.name || c.phone || c.email);
    return this.prisma.company.create({
      data: {
        name: dto.name.trim(),
        postalCode:    dto.postalCode?.trim()    || null,
        address:       dto.address?.trim()       || null,
        phone:         dto.phone?.trim()         || null,
        email:         dto.email?.trim()         || null,
        contactPerson: dto.contactPerson?.trim() || null,
        contacts: contacts.length ? { create: contacts } : undefined,
      },
      include: { contacts: true },
    });
  }

  async findAll(params: { keyword?: string; limit?: number; offset?: number } = {}) {
    const { keyword } = params;
    const limit  = Math.min(params.limit  ?? 20, 100);
    const offset = params.offset ?? 0;

    const where = keyword?.trim()
      ? {
          OR: [
            { name:    { contains: keyword.trim(), mode: 'insensitive' as const } },
            { address: { contains: keyword.trim(), mode: 'insensitive' as const } },
            { contacts: { some: { name: { contains: keyword.trim(), mode: 'insensitive' as const } } } },
          ],
        }
      : undefined;

    const [total, items] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: { contacts: true },
      }),
    ]);

    return { items, total, limit, offset };
  }

  findOne(id: string) {
    return this.prisma.company.findFirst({ where: { id }, include: { contacts: true } });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const contacts = dto.contacts
      ?.map((c) => ({ name: c.name?.trim() || null, phone: c.phone?.trim() || null, email: c.email?.trim() || null }))
      .filter((c) => c.name || c.phone || c.email) ?? null;
    return this.prisma.company.update({
      where: { id },
      data: {
        name:          dto.name?.trim()          ?? undefined,
        postalCode:    dto.postalCode?.trim()    ?? undefined,
        address:       dto.address?.trim()       ?? undefined,
        phone:         dto.phone?.trim()         ?? undefined,
        email:         dto.email?.trim()         ?? undefined,
        contactPerson: dto.contactPerson?.trim() ?? undefined,
        ...(contacts ? { contacts: { deleteMany: {}, create: contacts } } : {}),
      },
      include: { contacts: true },
    });
  }

  async remove(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }
}
