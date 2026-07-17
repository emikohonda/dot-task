// apps/api/src/companies/companies.controller.ts
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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationMembershipGuard } from '../auth/organization-membership.guard';
import { CurrentMembership } from '../auth/current-membership.decorator';
import type { AuthMembership } from '../auth/auth-membership.type';

@UseGuards(JwtAuthGuard, OrganizationMembershipGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(
    @CurrentMembership() membership: AuthMembership,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companiesService.create(membership.organizationId, createCompanyDto);
  }

  @Get()
  findAll(
    @CurrentMembership() membership: AuthMembership,
    @Query('keyword') keyword?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.companiesService.findAll(membership.organizationId, {
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
    return this.companiesService.findOne(membership.organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(membership.organizationId, id, updateCompanyDto);
  }

  @Delete(':id')
  remove(
    @CurrentMembership() membership: AuthMembership,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.companiesService.remove(membership.organizationId, id);
  }
}
