import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { Resource, Action, Scope } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId/dashboard')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @RequirePermission(Resource.PROJECT, Action.VIEW)
  async getDashboard(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
    @CurrentUser() user: { id: number },
  ) {
    return this.dashboardService.getDashboard(projectId, req.scope as Scope, user.id);
  }
}
