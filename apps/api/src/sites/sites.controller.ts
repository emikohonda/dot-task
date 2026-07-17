// apps/api/src/sites/sites.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { SitesService } from "./sites.service";
import { CreateSiteDto } from "./dto/create-site.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrganizationMembershipGuard } from "../auth/organization-membership.guard";
import { CurrentMembership } from "../auth/current-membership.decorator";
import type { AuthMembership } from "../auth/auth-membership.type";

@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller("sites")
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  create(
    @CurrentMembership() membership: AuthMembership,
    @Body() createSiteDto: CreateSiteDto,
  ) {
    return this.sitesService.create(membership.organizationId, createSiteDto);
  }

  @Get()
  findAll(
    @CurrentMembership() membership: AuthMembership,
    @Query("keyword") keyword?: string,
    @Query("companyId") companyId?: string,
    @Query("status") status?: string,
    @Query("tab") tab?: string,
    @Query("sortDate") sortDate?: string,
    @Query("monthFrom") monthFrom?: string,
    @Query("monthTo") monthTo?: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("offset", new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.sitesService.findAll(membership.organizationId, {
      keyword,
      companyId,
      status,
      tab,
      sortDate,
      monthFrom,
      monthTo,
      limit,
      offset,
    });
  }

  @Get(":id")
  findOne(
    @CurrentMembership() membership: AuthMembership,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.sitesService.findOne(membership.organizationId, id);
  }

  @Patch(":id")
  update(
    @CurrentMembership() membership: AuthMembership,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.sitesService.update(membership.organizationId, id, updateSiteDto);
  }

  @Delete(":id")
  remove(
    @CurrentMembership() membership: AuthMembership,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.sitesService.remove(membership.organizationId, id);
  }

  @Get(":id/schedules")
  findSchedulesBySiteId(
    @CurrentMembership() membership: AuthMembership,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.sitesService.findSchedulesBySiteId(
      membership.organizationId,
      id,
      limit ?? 3,
    );
  }
}
