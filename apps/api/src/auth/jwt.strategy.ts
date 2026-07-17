// apps/api/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from './auth-user.type';

type JwtPayload = {
  userId?: string;
  // Web側が旧形式のJWTを送る移行期間との互換性のため残している。
  // 値は認証処理では使用しない。
  organizationId?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('AUTH_SECRET');

    if (!secret) {
      throw new Error('AUTH_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.userId,
    };
  }
}
