// apps/api/src/schedules/schedules.controller.ts
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
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.type';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
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
    return this.schedulesService.findAll(user.organizationId, {
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
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.schedulesService.findOne(user.organizationId, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(user.organizationId, {
      title: dto.title,
      date: dto.date,
      endDate: dto.endDate ?? null,
      siteId: dto.siteId,
      siteNameToCreate: dto.siteNameToCreate,
      contractorIds: dto.contractorIds ?? [],
      contractorNamesToCreate: dto.contractorNamesToCreate ?? [],
      employeeIds: dto.employeeIds ?? [],
      description: dto.description ?? null,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
    });
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(user.organizationId, id, {
      title: dto.title,
      date: dto.date,
      endDate: dto.endDate,
      siteId: dto.siteId,
      siteNameToCreate: dto.siteNameToCreate,
      contractorIds: dto.contractorIds,
      contractorNamesToCreate: dto.contractorNamesToCreate,
      employeeIds: dto.employeeIds,
      description: dto.description,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.schedulesService.remove(user.organizationId, id);
  }
}