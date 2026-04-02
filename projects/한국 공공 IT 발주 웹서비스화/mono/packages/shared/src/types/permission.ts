import { Resource, Action, Scope } from "../enums";

export interface PermissionDto {
  id: number;
  resource: Resource;
  action: Action;
}

export interface RolePermissionDto {
  id: number;
  roleId: number;
  permissionId: number;
  scope: Scope;
}

export interface ProjectRolePermissionDto {
  id: number;
  projectId: number;
  roleId: number;
  permissionId: number;
  scope: Scope;
}
