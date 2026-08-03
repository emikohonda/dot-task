// apps/api/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapAuthDto } from './dto/bootstrap-auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private async upsertUser(dto: BootstrapAuthDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name?.trim() || null;
    const image = dto.image?.trim() || null;

    return this.prisma.user.upsert({
      where: { email },
      update: { name, image },
      create: { email, name, image },
    });
  }

  async syncUser(dto: BootstrapAuthDto) {
    const user = await this.upsertUser(dto);

    return { userId: user.id };
  }
}
