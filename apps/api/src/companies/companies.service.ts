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
      .map((c) => ({
        name: c.name?.trim() || null,
        phone: c.phone?.trim() || null,
        email: c.email?.trim() || null,
      }))
      .filter((c) => c.name || c.phone || c.email);

    return this.prisma.company.create({
      data: {
        name: dto.name.trim(),
        postalCode: dto.postalCode?.trim() || null,
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        contactPerson: dto.contactPerson?.trim() || null,
        contacts: contacts.length ? { create: contacts } : undefined,
      },
      include: { contacts: true },
    });
  }

  async findAll(params: { keyword?: string; limit?: number; offset?: number } = {}) {
    const { keyword } = params;
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = params.offset ?? 0;

    const where = keyword?.trim()
      ? {
          OR: [
            { name: { contains: keyword.trim(), mode: "insensitive" as const } },
            { address: { contains: keyword.trim(), mode: "insensitive" as const } },
            {
              contacts: {
                some: {
                  name: { contains: keyword.trim(), mode: "insensitive" as const },
                },
              },
            },
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
    return this.prisma.company.findFirst({
      where: { id },
      include: { contacts: true },
    });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const contacts =
      dto.contacts
        ?.map((c) => ({
          id: c.id,
          name: c.name?.trim() || null,
          phone: c.phone?.trim() || null,
          email: c.email?.trim() || null,
        }))
        .filter((c) => c.name || c.phone || c.email) ?? null;

    return this.prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id },
        data: {
          name: dto.name?.trim() ?? undefined,
          postalCode: dto.postalCode?.trim() ?? undefined,
          address: dto.address?.trim() ?? undefined,
          phone: dto.phone?.trim() ?? undefined,
          email: dto.email?.trim() ?? undefined,
          contactPerson: dto.contactPerson?.trim() ?? undefined,
        },
      });

      if (contacts) {
        const existingContacts = await tx.companyContact.findMany({
          where: { companyId: id },
          select: { id: true },
        });

        const existingIds = new Set(existingContacts.map((c) => c.id));
        const incomingIds = new Set(
          contacts.map((c) => c.id).filter((v): v is string => Boolean(v))
        );

        const toDeleteIds = [...existingIds].filter((existingId) => !incomingIds.has(existingId));

        if (toDeleteIds.length > 0) {
          await tx.siteCompanyContact.deleteMany({
            where: { companyContactId: { in: toDeleteIds } },
          });

          await tx.companyContact.deleteMany({
            where: {
              id: { in: toDeleteIds },
              companyId: id,
            },
          });
        }

        for (const contact of contacts) {
          if (contact.id && existingIds.has(contact.id)) {
            await tx.companyContact.update({
              where: { id: contact.id },
              data: {
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
              },
            });
          } else {
            await tx.companyContact.create({
              data: {
                companyId: id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
              },
            });
          }
        }
      }

      return tx.company.findFirst({
        where: { id },
        include: { contacts: true },
      });
    });
  }

  async remove(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }
}