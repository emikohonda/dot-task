// apps/api/src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { BootstrapAuthDto } from './dto/bootstrap-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('bootstrap')
  bootstrap(
    @Headers('x-bootstrap-secret') bootstrapSecret: string | undefined,
    @Body() dto: BootstrapAuthDto,
  ) {
    const authSecret = this.configService.get<string>('AUTH_SECRET');

    if (!authSecret || bootstrapSecret !== authSecret) {
      throw new UnauthorizedException('Invalid bootstrap secret');
    }

    return this.authService.bootstrap(dto);
  }
}