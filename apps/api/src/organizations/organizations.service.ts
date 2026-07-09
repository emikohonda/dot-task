// apps/api/src/organizations/organizations.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization membership not found');
    }

    return {
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
      createdAt: membership.organization.createdAt,
      updatedAt: membership.organization.updatedAt,
      user: membership.user,
    };
  }

  async updateMe(
    userId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization membership not found');
    }

    const organization = await this.prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        name: dto.name.trim(),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: organization.id,
      name: organization.name,
      role: membership.role,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  async deleteMe(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization membership not found');
    }

    if (membership.role !== OrgRole.OWNER) {
      throw new ForbiddenException(
        'Only an OWNER can delete the organization',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const sites = await tx.site.findMany({
        where: { organizationId },
        select: { id: true },
      });

      const siteIds = sites.map((site) => site.id);

      const contractors = await tx.contractor.findMany({
        where: { organizationId },
        select: { id: true },
      });

      const contractorIds = contractors.map((contractor) => contractor.id);

      const invoices = await tx.invoice.findMany({
        where: {
          siteId: {
            in: siteIds,
          },
        },
        select: { id: true },
      });

      const invoiceIds = invoices.map((invoice) => invoice.id);

      const workRecords = await tx.workRecord.findMany({
        where: {
          siteId: {
            in: siteIds,
          },
        },
        select: { id: true },
      });

      const workRecordIds = workRecords.map((workRecord) => workRecord.id);

      await tx.receipt.deleteMany({
        where: {
          invoiceId: {
            in: invoiceIds,
          },
        },
      });

      await tx.invoiceItem.deleteMany({
        where: {
          OR: [
            {
              invoiceId: {
                in: invoiceIds,
              },
            },
            {
              workRecordId: {
                in: workRecordIds,
              },
            },
          ],
        },
      });

      await tx.invoice.deleteMany({
        where: {
          id: {
            in: invoiceIds,
          },
        },
      });

      await tx.workRecord.deleteMany({
        where: {
          id: {
            in: workRecordIds,
          },
        },
      });

      await tx.siteContractor.deleteMany({
        where: {
          OR: [
            {
              siteId: {
                in: siteIds,
              },
            },
            {
              contractorId: {
                in: contractorIds,
              },
            },
          ],
        },
      });

      await tx.schedule.deleteMany({
        where: {
          organizationId,
        },
      });

      await tx.site.deleteMany({
        where: {
          organizationId,
        },
      });

      await tx.employee.deleteMany({
        where: {
          organizationId,
        },
      });

      await tx.contractor.deleteMany({
        where: {
          organizationId,
        },
      });

      await tx.company.deleteMany({
        where: {
          organizationId,
        },
      });

      await tx.organizationMember.deleteMany({
        where: {
          organizationId,
        },
      });

      await tx.organization.delete({
        where: {
          id: organizationId,
        },
      });
    });

    return {
      ok: true,
    };
  }
}
