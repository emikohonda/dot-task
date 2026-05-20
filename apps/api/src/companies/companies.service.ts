// apps/api/src/companies/companies.service.ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";

const normalize = (v?: string | null): string | null => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getTemporaryOrganizationId() {
    const organization = await this.prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!organization) {
      throw new BadRequestException("Temporary organization not found");
    }

    return organization.id;
  }

  async create(dto: CreateCompanyDto) {
    const organizationId = await this.getTemporaryOrganizationId();

    const name = dto.name?.trim();
    if (!name) throw new BadRequestException("name is required");

    const contacts = (dto.contacts ?? [])
      .map((c) => ({
        name: normalize(c.name),
        phone: normalize(c.phone),
        email: normalize(c.email),
      }))
      .filter((c) => c.name || c.phone || c.email);

    return this.prisma.company.create({
      data: {
        organizationId,
        name,
        postalCode: normalize(dto.postalCode),
        address: normalize(dto.address),
        phone: normalize(dto.phone),
        email: normalize(dto.email),
        contactPerson: normalize(dto.contactPerson),
        contacts: contacts.length ? { create: contacts } : undefined,
      },
      include: { contacts: true },
    });
  }

  async findAll(params: { keyword?: string; limit?: number; offset?: number } = {}) {
    const organizationId = await this.getTemporaryOrganizationId();

    const { keyword } = params;
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = params.offset ?? 0;

    const where = {
      organizationId,
      ...(keyword?.trim()
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
        : {}),
    };

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

  async findOne(id: string) {
    const organizationId = await this.getTemporaryOrganizationId();

    const company = await this.prisma.company.findFirst({
      where: { id, organizationId },
      include: { contacts: true },
    });

    if (!company) throw new NotFoundException("Company not found");

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const organizationId = await this.getTemporaryOrganizationId();

    const contacts =
      dto.contacts
        ?.map((c) => ({
          id: c.id,
          name: normalize(c.name),
          phone: normalize(c.phone),
          email: normalize(c.email),
        }))
        .filter((c) => c.name || c.phone || c.email) ?? null;

    return this.prisma.$transaction(async (tx) => {
      const exists = await tx.company.findFirst({
        where: { id, organizationId },
        select: { id: true },
      });

      if (!exists) throw new NotFoundException("Company not found");

      const name = dto.name !== undefined ? dto.name.trim() : undefined;
      if (name === "") throw new BadRequestException("name cannot be empty");

      await tx.company.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(dto.postalCode !== undefined ? { postalCode: normalize(dto.postalCode) } : {}),
          ...(dto.address !== undefined ? { address: normalize(dto.address) } : {}),
          ...(dto.phone !== undefined ? { phone: normalize(dto.phone) } : {}),
          ...(dto.email !== undefined ? { email: normalize(dto.email) } : {}),
          ...(dto.contactPerson !== undefined
            ? { contactPerson: normalize(dto.contactPerson) }
            : {}),
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
        where: { id, organizationId },
        include: { contacts: true },
      });
    });
  }

  async remove(id: string) {
    const organizationId = await this.getTemporaryOrganizationId();

    const exists = await this.prisma.company.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });

    if (!exists) throw new NotFoundException("Company not found");

    return this.prisma.company.delete({ where: { id } });
  }
}