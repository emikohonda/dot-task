import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './auth-user.type';
import type { AuthMembership } from './auth-membership.type';

@Injectable()
export class OrganizationMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      membership?: AuthMembership;
    }>();

    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId },
      select: {
        organizationId: true,
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'ORGANIZATION_MEMBERSHIP_REQUIRED',
        message: 'この操作には組織への所属が必要です',
      });
    }

    request.membership = membership;

    return true;
  }
}
