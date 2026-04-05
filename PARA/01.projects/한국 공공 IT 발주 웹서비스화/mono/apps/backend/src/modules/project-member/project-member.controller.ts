import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Resource, Action, Scope } from '@prisma/client';
import { ProjectMemberService } from './project-member.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProjectMemberController {
  constructor(private readonly memberService: ProjectMemberService) {}

  @Post()
  @RequirePermission(Resource.MEMBER, Action.INVITE)
  async invite(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: InviteMemberDto,
  ) {
    return this.memberService.invite(projectId, dto);
  }

  @Get()
  @RequirePermission(Resource.MEMBER, Action.VIEW)
  async findMany(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.memberService.findMany(
      projectId,
      req.scope as Scope,
      req.user?.projectCompanyId,
      Number(limit) || 10,
      Number(offset) || 0,
    );
  }

  @Patch(':memberId')
  @RequirePermission(Resource.MEMBER, Action.MANAGE)
  async update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.memberService.update(projectId, memberId, dto);
  }

  @Delete(':memberId')
  @RequirePermission(Resource.MEMBER, Action.REMOVE)
  async delete(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.memberService.delete(projectId, memberId);
  }

  @Get('overlap')
  @RequirePermission(Resource.MEMBER, Action.VIEW)
  async findOverlapping(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.memberService.findOverlappingMembers(projectId);
  }
}
