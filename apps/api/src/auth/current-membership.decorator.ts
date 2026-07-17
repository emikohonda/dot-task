import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthMembership } from './auth-membership.type';

export const CurrentMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthMembership => {
    const request = ctx.switchToHttp().getRequest<{
      membership?: AuthMembership;
    }>();

    return request.membership as AuthMembership;
  },
);
