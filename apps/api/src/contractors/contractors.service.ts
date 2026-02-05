import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContractorDto) {
    return this.prisma.contractor.create({
      data: {
        name: dto.name,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.contractor.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.contractor.findUnique({
      where: { id },
    });
  }

  update(id: string, dto: UpdateContractorDto) {
    return this.prisma.contractor.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        phone: dto.phone ?? undefined,
        email: dto.email ?? undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.contractor.delete({
      where: { id },
    });
  }
}