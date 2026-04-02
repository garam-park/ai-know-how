import { Injectable, NotFoundException } from '@nestjs/common';
import { Scope, WbsType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(projectId: number, scope: Scope, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException({ code: 404000, message: '프로젝트를 찾을 수 없습니다.' });
    }

    const daysLeft = Math.ceil(
      (new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    // WBS 노드 가져오기 (scope 필터링)
    let wbsWhere: any = { projectId, deletedAt: null };
    if (scope === Scope.OWN_COMPANY) {
      const member = await this.prisma.projectMember.findFirst({
        where: { projectId, userId, deletedAt: null },
        select: { projectCompanyId: true },
      });
      if (member) {
        wbsWhere.projectCompanyId = member.projectCompanyId;
      }
    } else if (scope === Scope.OWN_TASK) {
      wbsWhere.assigneeId = userId;
    }

    const allNodes = await this.prisma.wbsNode.findMany({
      where: wbsWhere,
      include: { projectCompany: { include: { company: { select: { id: true, name: true } } } } },
    });

    // 전체 진척률: 최상위 노드의 가중평균
    const rootNodes = allNodes.filter((n) => n.parentId === null);
    const overallProgress = this.weightedAvg(rootNodes);

    // 회사별 진척률
    const companyMap = new Map<number, { name: string; nodes: typeof allNodes }>();
    for (const node of allNodes) {
      if (node.projectCompany?.company) {
        const cid = node.projectCompany.company.id;
        if (!companyMap.has(cid)) {
          companyMap.set(cid, { name: node.projectCompany.company.name, nodes: [] });
        }
        companyMap.get(cid)!.nodes.push(node);
      }
    }

    const byCompany = Array.from(companyMap.entries()).map(([id, data]) => ({
      company: { id, name: data.name },
      progress: this.weightedAvg(data.nodes.filter((n) => n.type === WbsType.TASK)),
    }));

    // 멤버 통계
    let memberWhere: any = { projectId, deletedAt: null };
    if (scope === Scope.OWN_COMPANY) {
      const member = await this.prisma.projectMember.findFirst({
        where: { projectId, userId, deletedAt: null },
        select: { projectCompanyId: true },
      });
      if (member) {
        memberWhere.projectCompanyId = member.projectCompanyId;
      }
    }

    const members = await this.prisma.projectMember.findMany({
      where: memberWhere,
      include: { projectCompany: { include: { company: { select: { id: true, name: true } } } } },
    });

    const memberByCompany = new Map<number, { name: string; count: number }>();
    for (const m of members) {
      const cid = m.projectCompany.company.id;
      const existing = memberByCompany.get(cid);
      if (existing) {
        existing.count++;
      } else {
        memberByCompany.set(cid, { name: m.projectCompany.company.name, count: 1 });
      }
    }

    // WBS 요약 (TASK만)
    const tasks = allNodes.filter((n) => n.type === WbsType.TASK);
    const wbsSummary = {
      total: tasks.length,
      completed: tasks.filter((t) => t.progress === 100).length,
      inProgress: tasks.filter((t) => t.progress > 0 && t.progress < 100).length,
      notStarted: tasks.filter((t) => t.progress === 0).length,
    };

    return {
      code: 200000,
      result: {
        project: {
          id: project.id,
          name: project.name,
          startDate: project.startDate,
          endDate: project.endDate,
          daysLeft,
        },
        progress: {
          overall: overallProgress,
          byCompany,
        },
        members: {
          total: members.length,
          byCompany: Array.from(memberByCompany.entries()).map(([id, data]) => ({
            company: { id, name: data.name },
            count: data.count,
          })),
        },
        wbs: wbsSummary,
      },
    };
  }

  private weightedAvg(nodes: { progress: number; weight: number }[]): number {
    if (nodes.length === 0) return 0;
    const totalWeight = nodes.reduce((s, n) => s + n.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = nodes.reduce((s, n) => s + n.progress * n.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }
}
