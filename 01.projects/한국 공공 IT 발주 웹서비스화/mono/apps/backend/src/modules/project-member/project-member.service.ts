import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Scope } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

const MEMBER_INCLUDE = {
  user: { select: { id: true, email: true, name: true } },
  projectCompany: { include: { company: { select: { id: true, name: true } } } },
  role: { select: { id: true, name: true } },
};

@Injectable()
export class ProjectMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(projectId: number, dto: InviteMemberDto) {
    // 유저 검색
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException({ code: 404000, message: '해당 이메일의 사용자를 찾을 수 없습니다.' });
    }

    // 중복 멤버 검사
    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException({ code: 409001, message: '이미 프로젝트에 참여중인 멤버입니다.' });
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        projectCompanyId: dto.projectCompanyId,
        roleId: dto.roleId,
        inputRate: dto.inputRate ?? 100,
      },
      include: MEMBER_INCLUDE,
    });

    return { code: 201000, result: { member } };
  }

  async findMany(
    projectId: number,
    scope: Scope,
    currentUserCompanyId?: number,
    limit = 10,
    offset = 0,
  ) {
    const where: any = { projectId, deletedAt: null };
    if (scope === Scope.OWN_COMPANY && currentUserCompanyId) {
      where.projectCompany = { companyId: currentUserCompanyId };
    }

    const [members, totalCount] = await Promise.all([
      this.prisma.projectMember.findMany({
        where,
        take: limit,
        skip: offset,
        include: MEMBER_INCLUDE,
        orderBy: { id: 'asc' },
      }),
      this.prisma.projectMember.count({ where }),
    ]);

    return { code: 200000, result: { members, totalCount } };
  }

  async update(projectId: number, memberId: number, dto: UpdateMemberDto) {
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException({ code: 404000, message: '멤버를 찾을 수 없습니다.' });
    }

    const updated = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { roleId: dto.roleId, inputRate: dto.inputRate },
      include: MEMBER_INCLUDE,
    });

    return { code: 200000, result: { member: updated } };
  }

  async delete(projectId: number, memberId: number) {
    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException({ code: 404000, message: '멤버를 찾을 수 없습니다.' });
    }

    await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { deletedAt: new Date() },
    });

    return { code: 200000, result: { message: '멤버가 제거되었습니다.' } };
  }

  async findOverlappingMembers(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { startDate: true, endDate: true },
    });
    if (!project) {
      throw new NotFoundException({ code: 404000, message: '프로젝트를 찾을 수 없습니다.' });
    }

    const members = await this.prisma.projectMember.findMany({
      where: { projectId, deletedAt: null },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    const overlaps = [];
    for (const member of members) {
      const otherMemberships = await this.prisma.projectMember.findMany({
        where: { userId: member.userId, deletedAt: null, projectId: { not: projectId } },
        include: {
          project: { select: { id: true, name: true, startDate: true, endDate: true } },
        },
      });

      const overlapping = otherMemberships.filter((om) =>
        this.isDateRangeOverlap(
          project.startDate,
          project.endDate,
          om.project.startDate,
          om.project.endDate,
        ),
      );

      if (overlapping.length > 0) {
        const totalInputRate =
          member.inputRate +
          overlapping.reduce((sum, om) => sum + om.inputRate, 0);

        if (totalInputRate > 100) {
          overlaps.push({
            user: member.user,
            currentInputRate: member.inputRate,
            projects: overlapping.map((om) => ({
              project: om.project,
              inputRate: om.inputRate,
            })),
            totalInputRate,
          });
        }
      }
    }

    return { code: 200000, result: { overlaps, totalCount: overlaps.length } };
  }

  private isDateRangeOverlap(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
    return s1 <= e2 && s2 <= e1;
  }
}
