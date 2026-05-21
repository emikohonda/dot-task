// apps/api/src/contractors/contractors.service.ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContractorDto } from "./dto/create-contractor.dto";
import { UpdateContractorDto } from "./dto/update-contractor.dto";

@Injectable()
export class ContractorsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getTemporaryOrganizationId() {
    const organization = await this.prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!organization) {
      throw new BadRequestException("Organization not found");
    }
    return organization.id;
  }

  async create(dto: CreateContractorDto) {
    const organizationId = await this.getTemporaryOrganizationId();

    const contacts = (dto.contacts ?? [])
      .map((c) => ({
        name: c.name?.trim() || null,
        phone: c.phone?.trim() || null,
        email: c.email?.trim() || null,
      }))
      .filter((c) => c.name || c.phone || c.email);

    return this.prisma.contractor.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        postalCode: dto.postalCode?.trim() || null,
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
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
    const trimmedKeyword = keyword?.trim();

    const where = {
      organizationId,
      ...(trimmedKeyword
        ? {
            OR: [
              { name: { contains: trimmedKeyword, mode: "insensitive" as const } },
              { address: { contains: trimmedKeyword, mode: "insensitive" as const } },
              { contacts: { some: { name: { contains: trimmedKeyword, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.contractor.count({ where }),
      this.prisma.contractor.findMany({
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
    return this.prisma.contractor.findFirst({
      where: { id, organizationId },
      include: { contacts: true },
    });
  }

  async update(id: string, dto: UpdateContractorDto) {
    const organizationId = await this.getTemporaryOrganizationId();

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
      const existing = await tx.contractor.findFirst({
        where: { id, organizationId },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException("Contractor not found");
      }

      await tx.contractor.update({
        where: { id },
        data: {
          name: dto.name?.trim() ?? undefined,
          postalCode: dto.postalCode !== undefined ? dto.postalCode.trim() || null : undefined,
          address: dto.address !== undefined ? dto.address.trim() || null : undefined,
          phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined,
          email: dto.email !== undefined ? dto.email.trim() || null : undefined,
        },
      });

      if (contacts) {
        const existingContacts = await tx.contractorContact.findMany({
          where: { contractorId: id },
          select: { id: true },
        });

        const existingIds = new Set(existingContacts.map((c) => c.id));
        const incomingIds = new Set(
          contacts.map((c) => c.id).filter((v): v is string => Boolean(v))
        );

        const toDeleteIds = [...existingIds].filter((existingId) => !incomingIds.has(existingId));

        if (toDeleteIds.length > 0) {
          await tx.contractorContact.deleteMany({
            where: { id: { in: toDeleteIds }, contractorId: id },
          });
        }

        for (const contact of contacts) {
          if (contact.id && existingIds.has(contact.id)) {
            await tx.contractorContact.update({
              where: { id: contact.id },
              data: { name: contact.name, phone: contact.phone, email: contact.email },
            });
          } else {
            await tx.contractorContact.create({
              data: {
                contractorId: id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
              },
            });
          }
        }
      }

      return tx.contractor.findFirst({
        where: { id, organizationId },
        include: { contacts: true },
      });
    });
  }

  async remove(id: string) {
    const organizationId = await this.getTemporaryOrganizationId();
    const existing = await this.prisma.contractor.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException("Contractor not found");
    }
    return this.prisma.contractor.delete({ where: { id } });
  }
}