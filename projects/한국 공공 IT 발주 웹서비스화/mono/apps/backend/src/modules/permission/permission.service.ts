import { Injectable } from '@nestjs/common';
import { Resource, Action, Scope } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 특정 프로젝트에서 특정 유저가 resource:action 에 대해 갖는 Scope 를 반환한다.
   *
   * 우선순위:
   *  1. ProjectRolePermission (프로젝트별 오버라이드)
   *  2. RolePermission (역할 기본값)
   *  3. NONE (매칭 없음)
   */
  async getScope(
    projectId: number,
    userId: number,
    resource: Resource,
    action: Action,
  ): Promise<Scope> {
    // 1) 프로젝트 멤버인지 확인 → roleId 획득
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
        deletedAt: null,
      },
      select: { roleId: true },
    });
    if (!member) {
      return Scope.NONE;
    }

    // 2) Permission 레코드 조회
    const permission = await this.prisma.permission.findUnique({
      where: { resource_action: { resource, action } },
      select: { id: true },
    });
    if (!permission) {
      return Scope.NONE;
    }

    // 3) 프로젝트별 오버라이드 확인 (높은 우선순위)
    const projectOverride = await this.prisma.projectRolePermission.findUnique({
      where: {
        projectId_roleId_permissionId: {
          projectId,
          roleId: member.roleId,
          permissionId: permission.id,
        },
      },
      select: { scope: true },
    });
    if (projectOverride) {
      return projectOverride.scope;
    }

    // 4) 역할 기본값
    const roleDefault = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: member.roleId,
          permissionId: permission.id,
        },
      },
      select: { scope: true },
    });
    if (roleDefault) {
      return roleDefault.scope;
    }

    // 5) 매칭 없음
    return Scope.NONE;
  }
}
