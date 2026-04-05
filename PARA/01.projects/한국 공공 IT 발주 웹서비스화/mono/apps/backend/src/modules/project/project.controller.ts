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
import { Resource, Action } from '@prisma/client';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: { id: number }) {
    return this.projectService.create(dto, user.id);
  }

  @Get()
  async findMyProjects(
    @CurrentUser() user: { id: number },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.projectService.findMyProjects(user.id, Number(limit) || 10, Number(offset) || 0);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.projectService.findById(id, user.id);
  }

  @Patch(':projectId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.PROJECT, Action.EDIT)
  async update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(projectId, dto);
  }

  @Delete(':projectId')
  @UseGuards(PermissionGuard)
  @RequirePermission(Resource.PROJECT, Action.SETTING)
  async delete(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.delete(projectId);
  }
}
