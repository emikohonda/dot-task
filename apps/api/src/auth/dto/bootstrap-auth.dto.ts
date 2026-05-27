// apps/api/src/auth/dto/bootstrap-auth.dto.ts
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class BootstrapAuthDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  image?: string | null;
}