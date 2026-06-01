// apps/api/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapAuthDto } from './dto/bootstrap-auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(dto: BootstrapAuthDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name?.trim() || null;
    const image = dto.image?.trim() || null;

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        name,
        image,
      },
      create: {
        email,
        name,
        image,
      },
    });

    const existingMembership =
      await this.prisma.organizationMember.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

    if (existingMembership) {
      return {
        userId: user.id,
        organizationId: existingMembership.organizationId,
      };
    }

    return this.prisma.$transaction(
      async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: name ? `${name}のワークスペース` : '個人ワークスペース',
          },
        });

        const membership = await tx.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: OrgRole.OWNER,
          },
        });

        return {
          userId: user.id,
          organizationId: membership.organizationId,
        };
      },
      {
        timeout: 10000,
      },
    );
  }
}