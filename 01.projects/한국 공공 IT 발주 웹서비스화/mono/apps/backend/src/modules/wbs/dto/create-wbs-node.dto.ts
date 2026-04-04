import { IsEnum, IsInt, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { WbsType } from '@prisma/client';

export class CreateWbsNodeDto {
  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsEnum(WbsType)
  type: WbsType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;

  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @IsOptional()
  @IsInt()
  projectCompanyId?: number;
}
