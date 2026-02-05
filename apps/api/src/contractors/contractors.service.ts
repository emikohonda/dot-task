import { Injectable } from '@nestjs/common';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  create(createContractorDto: CreateContractorDto) {
    return 'This action adds a new contractor';
  }

  findAll() {
    return `This action returns all contractors`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contractor`;
  }

  update(id: number, updateContractorDto: UpdateContractorDto) {
    return `This action updates a #${id} contractor`;
  }

  remove(id: number) {
    return `This action removes a #${id} contractor`;
  }
}
