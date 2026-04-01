import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsInt()
  roleId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  inputRate?: number;
}
