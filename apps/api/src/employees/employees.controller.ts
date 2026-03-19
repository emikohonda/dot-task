// apps/api/src/employees/employees.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get()
  findAll(
    @Query('keyword') keyword?: string,
    @Query('limit',  new ParseIntPipe({ optional: true })) limit?:  number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.employeesService.findAll({ keyword, limit, offset });
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.employeesService.remove(id);
  }
}
