import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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
  findAll() {
    return this.contractorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContractorDto: UpdateContractorDto) {
    return this.contractorsService.update(+id, updateContractorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractorsService.remove(+id);
  }
}
