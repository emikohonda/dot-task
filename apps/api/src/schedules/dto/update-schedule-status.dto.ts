// apps/api/src/schedules/dto/update-schedule-status.dto.ts
import { IsEnum } from 'class-validator';
import { ScheduleStatus } from '@prisma/client';

export class UpdateScheduleStatusDto {
  @IsEnum(ScheduleStatus)
  status!: ScheduleStatus;
}