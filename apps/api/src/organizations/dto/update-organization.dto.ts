// apps/api/src/organizations/dto/update-organization.dto.ts
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}