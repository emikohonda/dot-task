// apps/api/src/users/users.controller.ts
import { Controller, Delete, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth-user.type';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteMe(user.userId);
  }
}
