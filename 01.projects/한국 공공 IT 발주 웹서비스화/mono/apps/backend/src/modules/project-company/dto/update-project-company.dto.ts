import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { CompanyRole } from '@prisma/client';

export class UpdateProjectCompanyDto {
  @IsOptional()
  @IsEnum(CompanyRole)
  role?: CompanyRole;

  @IsOptional()
  @IsInt()
  parentId?: number;
}
