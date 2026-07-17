import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../auth/organization-membership.guard';
import { CurrentMembership } from '../auth/current-membership.decorator';
import type { AuthMembership } from '../auth/auth-membership.type';

@Controller('schedules')
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(
    @CurrentMembership() membership: AuthMembership,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('date') date?: string,
    @Query('keyword') keyword?: string,
    @Query('tab') tab?: string,
    @Query('sortDate') sortDate?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('siteId') siteId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('contractorId') contractorId?: string,
  ) {
    return this.schedulesService.findAll(membership.organizationId, {
      limit,
      offset,
      date,
      keyword,
      tab,
      sortDate,
      dateFrom,
      dateTo,
      siteId,
      employeeId,
      contractorId,
    });
  }

  @Get(':id')
  findOne(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.schedulesService.findOne(membership.organizationId, id);
  }

  @Post()
  create(
    @CurrentMembership() membership: AuthMembership,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(membership.organizationId, {
      title: dto.title,
      date: dto.date,
      endDate: dto.endDate ?? null,
      siteId: dto.siteId,
      siteNameToCreate: dto.siteNameToCreate,
      siteCompanyId: dto.siteCompanyId,
      siteCompanyNameToCreate: dto.siteCompanyNameToCreate,
      contractorIds: dto.contractorIds ?? [],
      contractorNamesToCreate: dto.contractorNamesToCreate ?? [],
      employeeIds: dto.employeeIds ?? [],
      employeeNamesToCreate: dto.employeeNamesToCreate ?? [],
      description: dto.description ?? null,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
    });
  }

  @Patch(':id')
  update(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(membership.organizationId, id, {
      title: dto.title,
      date: dto.date,
      endDate: dto.endDate,
      siteId: dto.siteId,
      siteNameToCreate: dto.siteNameToCreate,
      siteCompanyId: dto.siteCompanyId,
      siteCompanyNameToCreate: dto.siteCompanyNameToCreate,
      contractorIds: dto.contractorIds,
      contractorNamesToCreate: dto.contractorNamesToCreate,
      employeeIds: dto.employeeIds,
      employeeNamesToCreate: dto.employeeNamesToCreate,
      description: dto.description,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });
  }

  @Delete(':id')
  remove(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.schedulesService.remove(membership.organizationId, id);
  }
}
