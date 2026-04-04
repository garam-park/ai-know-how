import { IsEmail, IsInt, IsOptional, Max, Min } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsInt()
  projectCompanyId: number;

  @IsInt()
  roleId: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  inputRate?: number;
}
