// apps/api/src/employees/dto/update-employee.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== '')  // 空文字はservice側でnull化されるので許可
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
