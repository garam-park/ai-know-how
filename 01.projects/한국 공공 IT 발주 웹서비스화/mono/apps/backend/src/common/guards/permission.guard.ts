import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Scope } from '@prisma/client';
import {
  PERMISSION_KEY,
  RequirePermissionMetadata,
} from '../decorators/require-permission.decorator';
import { PermissionService } from '../../modules/permission/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<RequirePermissionMetadata>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    if (!meta) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({ code: 403000, message: '인증 정보가 없습니다.' });
    }

    const projectId = Number(request.params.projectId);
    if (!projectId || isNaN(projectId)) {
      throw new BadRequestException({ code: 400000, message: 'projectId가 필요합니다.' });
    }

    const scope = await this.permissionService.getScope(
      projectId,
      user.id,
      meta.resource,
      meta.action,
    );

    if (scope === Scope.NONE) {
      throw new ForbiddenException({
        code: 403001,
        message: `권한이 부족합니다: ${meta.resource}:${meta.action}`,
      });
    }

    // Store scope in request for controller use
    request.scope = scope;
    return true;
  }
}
