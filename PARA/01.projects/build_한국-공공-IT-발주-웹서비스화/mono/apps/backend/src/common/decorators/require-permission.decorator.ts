import { SetMetadata } from '@nestjs/common';
import { Resource, Action } from '@prisma/client';

export interface RequirePermissionMetadata {
  resource: Resource;
  action: Action;
}

export const PERMISSION_KEY = 'permission';

export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action } as RequirePermissionMetadata);
