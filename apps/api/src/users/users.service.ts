// apps/api/src/users/users.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteMe(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          membership: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.membership) {
        throw new ConflictException({
          statusCode: 409,
          errorCode: 'USER_HAS_ORGANIZATION_MEMBERSHIP',
          message:
            'User must leave the organization before deleting the account',
        });
      }

      await tx.user.delete({
        where: {
          id: userId,
        },
      });

      return {
        ok: true,
      };
    });
  }
}
