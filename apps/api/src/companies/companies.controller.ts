// apps/api/src/companies/companies.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll(
    @Query('keyword') keyword?: string,
    @Query('limit',  new ParseIntPipe({ optional: true })) limit?:  number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.companiesService.findAll({ keyword, limit, offset });
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companiesService.remove(id);
  }
}
