// apps/api/src/employees/employees.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../auth/organization-membership.guard';
import { CurrentMembership } from '../auth/current-membership.decorator';
import type { AuthMembership } from '../auth/auth-membership.type';

@Controller('employees')
@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@CurrentMembership() membership: AuthMembership, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(membership.organizationId, dto);
  }

  @Get()
  findAll(
    @CurrentMembership() membership: AuthMembership,
    @Query('keyword') keyword?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.employeesService.findAll(membership.organizationId, {
      keyword,
      limit,
      offset,
    });
  }

  @Get(':id')
  findOne(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.employeesService.findOne(membership.organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(membership.organizationId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.employeesService.remove(membership.organizationId, id);
  }
}
