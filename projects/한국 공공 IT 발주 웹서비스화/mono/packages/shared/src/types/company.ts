export interface CompanyDto {
  id: number;
  name: string;
  bizNo?: string;
  address?: string;
  tel?: string;
  ownerId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateCompanyRequest {
  name: string;
  bizNo?: string;
  address?: string;
  tel?: string;
  ownerId?: number;
}

export interface UpdateCompanyRequest {
  name?: string;
  bizNo?: string;
  address?: string;
  tel?: string;
  ownerId?: number;
}
