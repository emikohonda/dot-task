// src/companies/companies.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
        postalCode: createCompanyDto.postalCode ?? null,
        address: createCompanyDto.address ?? null,
        phone: createCompanyDto.phone ?? null,
        email: createCompanyDto.email ?? null,
        contactPerson: createCompanyDto.contactPerson ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
    });
  }

  update(id: string, updateCompanyDto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id },
      data: {
        name: updateCompanyDto.name ?? undefined,
        postalCode: updateCompanyDto.postalCode ?? undefined,
        address: updateCompanyDto.address ?? undefined,
        phone: updateCompanyDto.phone ?? undefined,
        email: updateCompanyDto.email ?? undefined,
        contactPerson: updateCompanyDto.contactPerson ?? undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.company.delete({
      where: { id },
    });
  }
}