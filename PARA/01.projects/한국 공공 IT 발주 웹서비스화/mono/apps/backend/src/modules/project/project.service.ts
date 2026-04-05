import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1) 프로젝트 생성
      const project = await tx.project.create({
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          budget: dto.budget ? BigInt(dto.budget) : null,
          maxWbsDepth: dto.maxWbsDepth ?? 5,
        },
      });

      // 2) 주관사(PRIME) 등록 — companyId가 있으면 사용, 없으면 skip
      let projectCompany = null;
      if (dto.companyId) {
        projectCompany = await tx.projectCompany.create({
          data: {
            projectId: project.id,
            companyId: dto.companyId,
            role: CompanyRole.PRIME,
            parentId: null,
          },
        });
      }

      // 3) 생성자를 주관사PM(roleId=1)으로 등록
      if (projectCompany) {
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId,
            projectCompanyId: projectCompany.id,
            roleId: 1, // 주관사PM
            inputRate: 100,
          },
        });
      }

      return project;
    });

    return {
      code: 201000,
      result: {
        project: { ...result, budget: result.budget ? Number(result.budget) : null },
      },
    };
  }

  async findMyProjects(userId: number, limit = 10, offset = 0) {
    const where = {
      deletedAt: null,
      projectMembers: { some: { userId, deletedAt: null } },
    };

    const [projects, totalCount] = await Promise.all([
      this.prisma.project.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { id: 'desc' },
        include: {
          projectMembers: {
            where: { userId, deletedAt: null },
            include: { role: true, projectCompany: { include: { company: true } } },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const result = projects.map((p) => {
      const myMember = p.projectMembers[0];
      const daysLeft = Math.ceil(
        (new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        startDate: p.startDate,
        endDate: p.endDate,
        daysLeft,
        myRole: myMember?.role?.name ?? null,
        myCompany: myMember?.projectCompany?.company?.name ?? null,
      };
    });

    return { code: 200000, result: { projects: result, totalCount } };
  }

  async findById(id: number, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException({ code: 404000, message: '프로젝트를 찾을 수 없습니다.' });
    }

    // 멤버 여부 확인
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId }, deletedAt: null },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    if (!member) {
      throw new ForbiddenException({ code: 403000, message: '프로젝트 접근 권한이 없습니다.' });
    }

    const permissions = member.role.rolePermissions.map((rp) => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
      scope: rp.scope,
    }));

    return {
      code: 200000,
      result: {
        project: { ...project, budget: project.budget ? Number(project.budget) : null },
        myPermissions: permissions,
      },
    };
  }

  async update(id: number, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) {
      throw new NotFoundException({ code: 404000, message: '프로젝트를 찾을 수 없습니다.' });
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.budget !== undefined) data.budget = BigInt(dto.budget);
    if (dto.maxWbsDepth !== undefined) data.maxWbsDepth = dto.maxWbsDepth;

    const updated = await this.prisma.project.update({ where: { id }, data });
    return {
      code: 200000,
      result: { project: { ...updated, budget: updated.budget ? Number(updated.budget) : null } },
    };
  }

  async delete(id: number) {
    const project = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) {
      throw new NotFoundException({ code: 404000, message: '프로젝트를 찾을 수 없습니다.' });
    }

    await this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
    return { code: 200000, result: { message: '프로젝트가 삭제되었습니다.' } };
  }
}
