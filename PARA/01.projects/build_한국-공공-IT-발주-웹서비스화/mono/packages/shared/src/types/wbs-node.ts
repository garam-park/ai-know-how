import { WbsType } from "../enums";

export interface WbsNodeDto {
  id: number;
  projectId: number;
  parentId?: number;
  type: WbsType;
  depth: number;
  order: number;
  code?: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  weight: number;
  assigneeId?: number;
  projectCompanyId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateWbsNodeRequest {
  projectId: number;
  parentId?: number;
  type: WbsType;
  code?: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  weight?: number;
  assigneeId?: number;
  projectCompanyId?: number;
}

export interface UpdateWbsNodeRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  weight?: number;
  assigneeId?: number;
  projectCompanyId?: number;
}
