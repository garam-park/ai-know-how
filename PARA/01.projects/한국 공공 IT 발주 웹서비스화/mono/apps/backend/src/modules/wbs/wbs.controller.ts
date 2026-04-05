import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Resource, Action, Scope } from '@prisma/client';
import { WbsService } from './wbs.service';
import { CreateWbsNodeDto } from './dto/create-wbs-node.dto';
import { UpdateWbsNodeDto } from './dto/update-wbs-node.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ReorderWbsDto } from './dto/reorder-wbs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/wbs-nodes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WbsController {
  constructor(private readonly wbsService: WbsService) {}

  @Post()
  @RequirePermission(Resource.WBS, Action.EDIT)
  async create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateWbsNodeDto,
  ) {
    return this.wbsService.createNode(projectId, dto);
  }

  @Get()
  @RequirePermission(Resource.WBS, Action.VIEW)
  async getTree(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
    @CurrentUser() user: { id: number },
  ) {
    return this.wbsService.getTree(projectId, req.scope as Scope, user.id);
  }

  @Patch(':nodeId')
  @RequirePermission(Resource.WBS, Action.EDIT)
  async update(
    @Param('nodeId', ParseIntPipe) nodeId: number,
    @Body() dto: UpdateWbsNodeDto,
  ) {
    return this.wbsService.updateNode(nodeId, dto);
  }

  @Delete(':nodeId')
  @RequirePermission(Resource.WBS, Action.EDIT)
  async delete(@Param('nodeId', ParseIntPipe) nodeId: number) {
    return this.wbsService.deleteNode(nodeId);
  }

  @Patch(':nodeId/progress')
  @RequirePermission(Resource.WBS, Action.EDIT)
  async updateProgress(
    @Param('nodeId', ParseIntPipe) nodeId: number,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.wbsService.updateProgress(nodeId, dto);
  }

  @Patch('reorder')
  @RequirePermission(Resource.WBS, Action.EDIT)
  async reorder(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: ReorderWbsDto,
  ) {
    return this.wbsService.reorder(projectId, dto);
  }
}
