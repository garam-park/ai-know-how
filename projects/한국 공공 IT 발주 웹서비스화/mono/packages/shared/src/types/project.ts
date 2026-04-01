export interface ProjectDto {
  id: number;
  name: string;
  code?: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  maxWbsDepth: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  code?: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  maxWbsDepth?: number;
}

export interface UpdateProjectRequest {
  name?: string;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  maxWbsDepth?: number;
}
