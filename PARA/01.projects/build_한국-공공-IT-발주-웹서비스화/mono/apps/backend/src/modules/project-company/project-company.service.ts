import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectCompanyDto } from './dto/create-project-company.dto';
import { UpdateProjectCompanyDto } from './dto/update-project-company.dto';

@Injectable()
export class ProjectCompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: number, dto: CreateProjectCompanyDto) {
    // PRIME 중복 검사
    if (dto.role === CompanyRole.PRIME) {
      const existing = await this.prisma.projectCompany.findFirst({
        where: { projectId, role: CompanyRole.PRIME, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException({ code: 409000, message: '주관사는 프로젝트당 1개만 등록 가능합니다.' });
      }
    }

    // parentId 유효성 검사
    if (dto.parentId) {
      const parent = await this.prisma.projectCompany.findFirst({
        where: { id: dto.parentId, projectId, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException({ code: 400000, message: '유효하지 않은 상위 회사입니다.' });
      }
    }

    const pc = await this.prisma.projectCompany.create({
      data: { projectId, companyId: dto.companyId, role: dto.role, parentId: dto.parentId ?? null },
      include: { company: true },
    });

    return { code: 201000, result: { projectCompany: pc } };
  }

  async findTree(projectId: number) {
    const items = await this.prisma.projectCompany.findMany({
      where: { projectId, deletedAt: null },
      include: { company: true },
      orderBy: { id: 'asc' },
    });

    // O(n) 트리 구축
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }
    for (const item of items) {
      const node = map.get(item.id);
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return { code: 200000, result: { companies: roots, totalCount: items.length } };
  }

  async update(projectId: number, pcId: number, dto: UpdateProjectCompanyDto) {
    const pc = await this.prisma.projectCompany.findFirst({
      where: { id: pcId, projectId, deletedAt: null },
    });
    if (!pc) {
      throw new NotFoundException({ code: 404000, message: '컨소시엄사를 찾을 수 없습니다.' });
    }

    // PRIME 중복 검사
    if (dto.role === CompanyRole.PRIME && pc.role !== CompanyRole.PRIME) {
      const existing = await this.prisma.projectCompany.findFirst({
        where: { projectId, role: CompanyRole.PRIME, deletedAt: null, id: { not: pcId } },
      });
      if (existing) {
        throw new ConflictException({ code: 409000, message: '주관사는 프로젝트당 1개만 등록 가능합니다.' });
      }
    }

    // 순환 참조 방지
    if (dto.parentId !== undefined) {
      if (dto.parentId === pcId) {
        throw new BadRequestException({ code: 400000, message: '자기 자신을 상위로 설정할 수 없습니다.' });
      }
      if (dto.parentId) {
        const descendants = await this.findDescendantIds(pcId);
        if (descendants.includes(dto.parentId)) {
          throw new BadRequestException({ code: 400000, message: '순환 참조가 발생합니다.' });
        }
      }
    }

    const updated = await this.prisma.projectCompany.update({
      where: { id: pcId },
      data: { role: dto.role, parentId: dto.parentId },
      include: { company: true },
    });

    return { code: 200000, result: { projectCompany: updated } };
  }

  async delete(projectId: number, pcId: number) {
    const pc = await this.prisma.projectCompany.findFirst({
      where: { id: pcId, projectId, deletedAt: null },
    });
    if (!pc) {
      throw new NotFoundException({ code: 404000, message: '컨소시엄사를 찾을 수 없습니다.' });
    }

    // 하위 회사도 함께 삭제
    const descendantIds = await this.findDescendantIds(pcId);
    const allIds = [pcId, ...descendantIds];

    await this.prisma.projectCompany.updateMany({
      where: { id: { in: allIds } },
      data: { deletedAt: new Date() },
    });

    return { code: 200000, result: { message: '컨소시엄사가 삭제되었습니다.' } };
  }

  private async findDescendantIds(parentId: number): Promise<number[]> {
    const children = await this.prisma.projectCompany.findMany({
      where: { parentId, deletedAt: null },
      select: { id: true },
    });
    const ids: number[] = [];
    for (const child of children) {
      ids.push(child.id);
      const grandChildren = await this.findDescendantIds(child.id);
      ids.push(...grandChildren);
    }
    return ids;
  }
}
