// apps/api/src/organizations/organizations.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth-user.type';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  findMe(@CurrentUser() user: AuthUser) {
    return this.organizationsService.findMe(user.userId, user.organizationId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.updateMe(
      user.userId,
      user.organizationId,
      dto,
    );
  }

  @Delete('me')
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.organizationsService.deleteMe(
      user.userId,
      user.organizationId,
    );
  }
}