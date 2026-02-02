import { IsISO8601, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

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
}