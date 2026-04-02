import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Resource, Action } from '@prisma/client';
import { ProjectCompanyService } from './project-company.service';
import { CreateProjectCompanyDto } from './dto/create-project-company.dto';
import { UpdateProjectCompanyDto } from './dto/update-project-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('projects/:projectId/companies')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProjectCompanyController {
  constructor(private readonly pcService: ProjectCompanyService) {}

  @Get()
  @RequirePermission(Resource.COMPANY, Action.VIEW)
  async findTree(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.pcService.findTree(projectId);
  }

  @Post()
  @RequirePermission(Resource.COMPANY, Action.MANAGE)
  async create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateProjectCompanyDto,
  ) {
    return this.pcService.create(projectId, dto);
  }

  @Patch(':projectCompanyId')
  @RequirePermission(Resource.COMPANY, Action.MANAGE)
  async update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('projectCompanyId', ParseIntPipe) pcId: number,
    @Body() dto: UpdateProjectCompanyDto,
  ) {
    return this.pcService.update(projectId, pcId, dto);
  }

  @Delete(':projectCompanyId')
  @RequirePermission(Resource.COMPANY, Action.MANAGE)
  async delete(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('projectCompanyId', ParseIntPipe) pcId: number,
  ) {
    return this.pcService.delete(projectId, pcId);
  }
}
