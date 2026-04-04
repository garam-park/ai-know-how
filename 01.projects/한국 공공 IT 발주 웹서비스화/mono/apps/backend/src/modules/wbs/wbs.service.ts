import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Scope, WbsType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWbsNodeDto } from './dto/create-wbs-node.dto';
import { UpdateWbsNodeDto } from './dto/update-wbs-node.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ReorderWbsDto } from './dto/reorder-wbs.dto';

@Injectable()
export class WbsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 노드 생성 ──────────────────────────────────────────
  async createNode(projectId: number, dto: CreateWbsNodeDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { maxWbsDepth: true },
    });
    if (!project) {
      throw new NotFoundException({ code: 404000, message: '프로젝트를 찾을 수 없습니다.' });
    }

    let depth = 0;
    if (dto.parentId) {
      const parent = await this.prisma.wbsNode.findFirst({
        where: { id: dto.parentId, projectId, deletedAt: null },
      });
      if (!parent) {
        throw new BadRequestException({ code: 400000, message: '상위 노드를 찾을 수 없습니다.' });
      }
      if (parent.type !== WbsType.CATEGORY) {
        throw new BadRequestException({ code: 400000, message: 'TASK 노드 하위에는 노드를 추가할 수 없습니다.' });
      }
      depth = parent.depth + 1;
    }

    if (depth >= project.maxWbsDepth) {
      throw new BadRequestException({
        code: 400002,
        message: `최대 WBS 깊이(${project.maxWbsDepth})를 초과합니다.`,
      });
    }

    // 같은 레벨의 마지막 order + 1
    const lastSibling = await this.prisma.wbsNode.findFirst({
      where: { projectId, parentId: dto.parentId ?? null, deletedAt: null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = (lastSibling?.order ?? -1) + 1;

    const node = await this.prisma.wbsNode.create({
      data: {
        projectId,
        parentId: dto.parentId ?? null,
        type: dto.type,
        depth,
        order,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        weight: dto.weight ?? 1,
        assigneeId: dto.assigneeId,
        projectCompanyId: dto.projectCompanyId,
        progress: 0,
      },
    });

    return { code: 201000, result: { node } };
  }

  // ── 트리 조회 ──────────────────────────────────────────
  async getTree(projectId: number, scope: Scope, userId: number) {
    let where: any = { projectId, deletedAt: null };

    if (scope === Scope.OWN_TASK) {
      // 본인 할당 노드 + 경로
      const myNodes = await this.prisma.wbsNode.findMany({
        where: { projectId, assigneeId: userId, deletedAt: null },
      });
      const allNodeIds = new Set<number>();
      for (const n of myNodes) {
        allNodeIds.add(n.id);
        await this.addAncestorIds(n.parentId, allNodeIds);
      }
      where = { id: { in: Array.from(allNodeIds) }, deletedAt: null };
    } else if (scope === Scope.OWN_COMPANY) {
      // 자사 노드 + 경로
      const member = await this.prisma.projectMember.findFirst({
        where: { projectId, userId, deletedAt: null },
        select: { projectCompanyId: true },
      });
      const companyNodes = await this.prisma.wbsNode.findMany({
        where: { projectId, projectCompanyId: member?.projectCompanyId, deletedAt: null },
      });
      const allNodeIds = new Set<number>();
      for (const n of companyNodes) {
        allNodeIds.add(n.id);
        await this.addAncestorIds(n.parentId, allNodeIds);
      }
      where = { id: { in: Array.from(allNodeIds) }, deletedAt: null };
    }

    const nodes = await this.prisma.wbsNode.findMany({
      where,
      orderBy: [{ depth: 'asc' }, { order: 'asc' }],
    });

    const tree = this.buildTree(nodes);
    return { code: 200000, result: { nodes: tree, totalCount: nodes.length } };
  }

  // ── 노드 수정 ──────────────────────────────────────────
  async updateNode(nodeId: number, dto: UpdateWbsNodeDto) {
    const node = await this.prisma.wbsNode.findFirst({ where: { id: nodeId, deletedAt: null } });
    if (!node) {
      throw new NotFoundException({ code: 404000, message: 'WBS 노드를 찾을 수 없습니다.' });
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.assigneeId !== undefined) data.assigneeId = dto.assigneeId;
    if (dto.projectCompanyId !== undefined) data.projectCompanyId = dto.projectCompanyId;

    const updated = await this.prisma.wbsNode.update({ where: { id: nodeId }, data });

    // weight 변경 시 상위 재계산
    if (dto.weight !== undefined && node.parentId) {
      await this.recalculateProgress(node.parentId);
    }

    return { code: 200000, result: { node: updated } };
  }

  // ── 노드 삭제 ──────────────────────────────────────────
  async deleteNode(nodeId: number) {
    const node = await this.prisma.wbsNode.findFirst({ where: { id: nodeId, deletedAt: null } });
    if (!node) {
      throw new NotFoundException({ code: 404000, message: 'WBS 노드를 찾을 수 없습니다.' });
    }

    // 재귀적 soft delete
    await this.softDeleteRecursive(nodeId);

    // 상위 진척률 재계산
    if (node.parentId) {
      await this.recalculateProgress(node.parentId);
    }

    return { code: 200000, result: { message: 'WBS 노드가 삭제되었습니다.' } };
  }

  // ── 진척률 업데이트 ──────────────────────────────────────
  async updateProgress(nodeId: number, dto: UpdateProgressDto) {
    const node = await this.prisma.wbsNode.findFirst({ where: { id: nodeId, deletedAt: null } });
    if (!node) {
      throw new NotFoundException({ code: 404000, message: 'WBS 노드를 찾을 수 없습니다.' });
    }
    if (node.type !== WbsType.TASK) {
      throw new BadRequestException({ code: 400000, message: 'CATEGORY 노드의 진척률은 직접 수정할 수 없습니다.' });
    }

    await this.prisma.wbsNode.update({
      where: { id: nodeId },
      data: { progress: dto.progress },
    });

    const affectedNodes: number[] = [];
    if (node.parentId) {
      await this.recalculateProgress(node.parentId, affectedNodes);
    }

    const updatedNode = await this.prisma.wbsNode.findUnique({ where: { id: nodeId } });
    return { code: 200000, result: { node: updatedNode, affectedNodes } };
  }

  // ── 정렬/이동 ──────────────────────────────────────────
  async reorder(projectId: number, dto: ReorderWbsDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { maxWbsDepth: true },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.orders) {
        const data: any = { order: item.order };

        if (item.parentId !== undefined) {
          // 깊이 재계산
          let newDepth = 0;
          if (item.parentId) {
            const parent = await tx.wbsNode.findUnique({
              where: { id: item.parentId },
              select: { depth: true },
            });
            newDepth = (parent?.depth ?? -1) + 1;
          }
          if (project && newDepth >= project.maxWbsDepth) {
            throw new BadRequestException({ code: 400002, message: 'maxWbsDepth 초과' });
          }
          data.parentId = item.parentId;
          data.depth = newDepth;
        }

        await tx.wbsNode.update({ where: { id: item.nodeId }, data });
      }
    });

    // 영향받는 부모 노드들의 진척률 재계산
    const parentIds = new Set(dto.orders.filter((o) => o.parentId).map((o) => o.parentId!));
    for (const pid of parentIds) {
      await this.recalculateProgress(pid);
    }

    return { code: 200000, result: { message: '정렬이 완료되었습니다.' } };
  }

  // ── 진척률 재계산 (가중평균, 재귀 상향) ──────────────────
  async recalculateProgress(nodeId: number, affectedNodes: number[] = []): Promise<void> {
    const children = await this.prisma.wbsNode.findMany({
      where: { parentId: nodeId, deletedAt: null },
      select: { progress: true, weight: true },
    });

    if (children.length === 0) return;

    const totalWeight = children.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = children.reduce((sum, c) => sum + c.progress * c.weight, 0);
    const newProgress = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    await this.prisma.wbsNode.update({
      where: { id: nodeId },
      data: { progress: newProgress },
    });
    affectedNodes.push(nodeId);

    // 상위 노드도 재계산
    const node = await this.prisma.wbsNode.findUnique({
      where: { id: nodeId },
      select: { parentId: true },
    });
    if (node?.parentId) {
      await this.recalculateProgress(node.parentId, affectedNodes);
    }
  }

  // ── Private helpers ──────────────────────────────────────
  private buildTree(nodes: any[]): any[] {
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const node of nodes) {
      map.set(node.id, { ...node, children: [] });
    }
    for (const node of nodes) {
      const item = map.get(node.id);
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId).children.push(item);
      } else {
        roots.push(item);
      }
    }
    return roots;
  }

  private async addAncestorIds(parentId: number | null, ids: Set<number>): Promise<void> {
    if (!parentId) return;
    if (ids.has(parentId)) return;
    ids.add(parentId);
    const parent = await this.prisma.wbsNode.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });
    if (parent?.parentId) {
      await this.addAncestorIds(parent.parentId, ids);
    }
  }

  private async softDeleteRecursive(nodeId: number): Promise<void> {
    await this.prisma.wbsNode.update({
      where: { id: nodeId },
      data: { deletedAt: new Date() },
    });
    const children = await this.prisma.wbsNode.findMany({
      where: { parentId: nodeId, deletedAt: null },
      select: { id: true },
    });
    for (const child of children) {
      await this.softDeleteRecursive(child.id);
    }
  }
}
