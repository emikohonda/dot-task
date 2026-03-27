// apps/api/src/schedules/schedules.controller.ts
import {
  Controller, Get, Patch, Post, Delete,
  Param, Body, Query,
  ParseIntPipe, ParseUUIDPipe,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { UpdateScheduleStatusDto } from './dto/update-schedule-status.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(
    @Query('limit',  new ParseIntPipe({ optional: true })) limit?:  number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('date')          date?:          string,
    @Query('keyword')       keyword?:       string,
    @Query('status')        status?:        string,
    @Query('tab')           tab?:           string,  // 追加：'active' | 'done'
    @Query('sortDate')      sortDate?:      string,  // 追加：'asc' | 'desc'
    @Query('dateFrom')      dateFrom?:      string,
    @Query('dateTo')        dateTo?:        string,
    @Query('siteId')        siteId?:        string,
    @Query('employeeId')    employeeId?:    string,
    @Query('contractorId')  contractorId?:  string,
  ) {
    return this.schedulesService.findAll({
      limit, offset, date, keyword, status, tab, sortDate,
      dateFrom, dateTo, siteId, employeeId, contractorId,
    });
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create({
      title: dto.title, date: dto.date, siteId: dto.siteId,
      status: dto.status,
      contractorIds: dto.contractorIds ?? [],
      employeeIds: dto.employeeIds ?? [],
      description: dto.description ?? null,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
    });
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, {
      title: dto.title, date: dto.date, siteId: dto.siteId,
      status: dto.status, contractorIds: dto.contractorIds,
      employeeIds: dto.employeeIds, description: dto.description,
      startTime: dto.startTime, endTime: dto.endTime,
    });
  }

  @Patch(':id/status')
  updateStatus(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateScheduleStatusDto) {
    return this.schedulesService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.schedulesService.remove(id);
  }
}
