import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
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
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number
  ) {
    return this.schedulesService.findAll(limit);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create({
      title: dto.title,
      date: dto.date,
      siteId: dto.siteId,
    });
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateScheduleDto
  ) {
    return this.schedulesService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateScheduleStatusDto
  ) {
    return this.schedulesService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.schedulesService.remove(id);
  }
}