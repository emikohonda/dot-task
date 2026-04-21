// apps/api/src/contractors/dto/update-contractor.dto.ts
import { Transform, Type } from "class-transformer";
import { IsArray, IsEmail, IsOptional, IsString, ValidateNested } from "class-validator";

const emptyToUndef = ({ value }: { value: unknown }) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

class UpdateContractorContactDto {
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

export class UpdateContractorDto {
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContractorContactDto)
  contacts?: UpdateContractorContactDto[];
}