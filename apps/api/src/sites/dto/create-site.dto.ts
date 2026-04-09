// apps/api/src/sites/dto/create-site.dto.ts
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

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
  @IsArray()
  @IsString({ each: true })
  contactIds?: string[];
}