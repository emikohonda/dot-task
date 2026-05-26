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
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth-user.type";

@UseGuards(JwtAuthGuard)
@Controller("sites")
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() createSiteDto: CreateSiteDto,
  ) {
    return this.sitesService.create(user.organizationId, createSiteDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
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
    return this.sitesService.findAll(user.organizationId, {
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
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.sitesService.findOne(user.organizationId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.sitesService.update(user.organizationId, id, updateSiteDto);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.sitesService.remove(user.organizationId, id);
  }

  @Get(":id/schedules")
  findSchedulesBySiteId(
    @CurrentUser() user: AuthUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.sitesService.findSchedulesBySiteId(
      user.organizationId,
      id,
      limit ?? 3,
    );
  }
}