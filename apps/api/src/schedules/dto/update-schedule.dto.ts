// apps/api/src/schedules/dto/update-schedule.dto.ts
import {
  IsISO8601,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  IsArray,
} from 'class-validator';

const STATUS = ['TODO', 'DOING', 'HOLD', 'DONE', 'CANCELLED'] as const;
type Status = (typeof STATUS)[number];

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsIn(STATUS)
  status?: Status;

  // ✅ 複数協力会社
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  contractorIds?: string[];

  // ✅ 複数社員
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds?: string[];

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  startTime?: string | null;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  endTime?: string | null;
}