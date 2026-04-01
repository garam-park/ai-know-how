import { IsString, IsOptional, MaxLength, IsDateString, IsInt, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxWbsDepth?: number;

  @IsOptional()
  @IsInt()
  companyId?: number;
}
