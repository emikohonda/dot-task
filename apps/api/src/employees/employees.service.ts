// apps/api/src/employees/employees.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const normalize = (v?: string): string | null => {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
};

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(params: { keyword?: string; limit?: number; offset?: number } = {}) {
    const { keyword } = params;
    const limit  = Math.min(params.limit  ?? 20, 100);
    const offset = params.offset ?? 0;

    const where = keyword?.trim()
      ? {
          OR: [
            { name:  { contains: keyword.trim(), mode: 'insensitive' as const } },
            { role:  { contains: keyword.trim(), mode: 'insensitive' as const } },
            { email: { contains: keyword.trim(), mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [total, items] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: offset,
        take: limit,
        select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true, updatedAt: true },
      }),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    return this.prisma.employee.create({
      data: { name, phone: normalize(dto.phone), email: normalize(dto.email), role: normalize(dto.role) },
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const exists = await this.prisma.employee.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Employee not found');
    const name = dto.name !== undefined ? dto.name.trim() : undefined;
    if (name === '') throw new BadRequestException('name cannot be empty');
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(dto.phone !== undefined ? { phone: normalize(dto.phone) } : {}),
        ...(dto.email !== undefined ? { email: normalize(dto.email) } : {}),
        ...(dto.role  !== undefined ? { role:  normalize(dto.role)  } : {}),
      },
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  async remove(id: string) {
    const exists = await this.prisma.employee.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Employee not found');
    return this.prisma.employee.delete({ where: { id } });
  }
}
