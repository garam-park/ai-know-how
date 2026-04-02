import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { CompanyRole } from '@prisma/client';

export class CreateProjectCompanyDto {
  @IsInt()
  companyId: number;

  @IsEnum(CompanyRole)
  role: CompanyRole;

  @IsOptional()
  @IsInt()
  parentId?: number;
}
