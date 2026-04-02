import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async search(keyword?: string, limit = 10, offset = 0) {
    const where = {
      deletedAt: null,
      ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}),
    };

    const [companies, totalCount] = await Promise.all([
      this.prisma.company.findMany({ where, take: limit, skip: offset, orderBy: { id: 'desc' } }),
      this.prisma.company.count({ where }),
    ]);

    return { code: 200000, result: { companies, totalCount } };
  }

  async create(dto: CreateCompanyDto) {
    if (dto.bizNo) {
      const existing = await this.prisma.company.findUnique({ where: { bizNo: dto.bizNo } });
      if (existing) {
        throw new ConflictException({ code: 409000, message: '이미 등록된 사업자번호입니다.' });
      }
    }

    const company = await this.prisma.company.create({ data: dto });
    return { code: 201000, result: { company } };
  }

  async findById(id: number) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } });
    if (!company) {
      throw new NotFoundException({ code: 404000, message: '회사를 찾을 수 없습니다.' });
    }
    return { code: 200000, result: { company } };
  }

  async update(id: number, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } });
    if (!company) {
      throw new NotFoundException({ code: 404000, message: '회사를 찾을 수 없습니다.' });
    }

    if (dto.bizNo && dto.bizNo !== company.bizNo) {
      const existing = await this.prisma.company.findUnique({ where: { bizNo: dto.bizNo } });
      if (existing) {
        throw new ConflictException({ code: 409000, message: '이미 등록된 사업자번호입니다.' });
      }
    }

    const updated = await this.prisma.company.update({ where: { id }, data: dto });
    return { code: 200000, result: { company: updated } };
  }
}
