// apps/api/src/contractors/contractors.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  create(@Body() createContractorDto: CreateContractorDto) {
    return this.contractorsService.create(createContractorDto);
  }

  @Get()
  findAll(
    @Query('keyword') keyword?: string,
    @Query('limit',  new ParseIntPipe({ optional: true })) limit?:  number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.contractorsService.findAll({ keyword, limit, offset });
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.contractorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateContractorDto: UpdateContractorDto) {
    return this.contractorsService.update(id, updateContractorDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.contractorsService.remove(id);
  }
}
