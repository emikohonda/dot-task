// apps/api/src/sites/dto/create-site.dto.ts
import { IsString, IsOptional, IsDateString, IsArray, IsIn } from 'class-validator';

const SITE_COLOR_KEYS = [
  'sky',
  'blue',
  'cyan',
  'emerald',
  'green',
  'lime',
  'amber',
  'orange',
  'rose',
  'pink',
  'violet',
  'slate',
] as const;

export class CreateSiteDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsIn(SITE_COLOR_KEYS)
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactIds?: string[];
}