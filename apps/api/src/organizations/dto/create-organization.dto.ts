// apps/api/src/organizations/dto/create-organization.dto.ts

import {
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EMPLOYEE_RANGE_VALUES,
  INDUSTRY_VALUES,
  PREFECTURE_VALUES,
} from '../constants/organization-options';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsIn(INDUSTRY_VALUES)
  industry!: string;

  @IsString()
  @IsIn(PREFECTURE_VALUES)
  prefecture!: string;

  @IsString()
  @IsIn(EMPLOYEE_RANGE_VALUES)
  employeeRange!: string;
}
