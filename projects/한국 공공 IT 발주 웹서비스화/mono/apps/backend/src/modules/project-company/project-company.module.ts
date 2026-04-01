import { Module } from '@nestjs/common';
import { ProjectCompanyController } from './project-company.controller';
import { ProjectCompanyService } from './project-company.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [ProjectCompanyController],
  providers: [ProjectCompanyService],
  exports: [ProjectCompanyService],
})
export class ProjectCompanyModule {}
