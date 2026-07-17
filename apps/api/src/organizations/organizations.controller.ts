import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentMembership } from '../auth/current-membership.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../auth/organization-membership.guard';
import type { AuthUser } from '../auth/auth-user.type';
import type { AuthMembership } from '../auth/auth-membership.type';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @UseGuards(OrganizationMembershipGuard)
  findMe(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: AuthMembership,
  ) {
    return this.organizationsService.findMe(user.userId, membership.organizationId);
  }

  @Patch('me')
  @UseGuards(OrganizationMembershipGuard)
  updateMe(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: AuthMembership,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateMe(
      user.userId,
      membership.organizationId,
      dto,
    );
  }

  @Delete('me')
  @UseGuards(OrganizationMembershipGuard)
  deleteMe(
    @CurrentUser() user: AuthUser,
    @CurrentMembership() membership: AuthMembership,
  ) {
    return this.organizationsService.deleteMe(
      user.userId,
      membership.organizationId,
    );
  }
}
