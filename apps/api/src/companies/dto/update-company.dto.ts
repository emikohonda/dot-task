// apps/api/src/companies/dto/update-company.dto.ts
import { Transform, Type } from "class-transformer";
import { IsArray, IsEmail, IsOptional, IsString, ValidateNested } from "class-validator";

const emptyToUndef = ({ value }: { value: unknown }) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

class UpdateCompanyContactDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsEmail()
  email?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCompanyContactDto)
  contacts?: UpdateCompanyContactDto[];
}