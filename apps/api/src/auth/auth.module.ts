import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { OrganizationMembershipGuard } from './organization-membership.guard';

@Module({
  imports: [PassportModule, PrismaModule],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    OrganizationMembershipGuard,
    AuthService,
  ],
  exports: [
    PassportModule,
    JwtAuthGuard,
    OrganizationMembershipGuard,
  ],
})
export class AuthModule {}
