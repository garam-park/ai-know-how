import { Module } from '@nestjs/common';
import { WbsController } from './wbs.controller';
import { WbsService } from './wbs.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [PrismaModule, PermissionModule],
  controllers: [WbsController],
  providers: [WbsService],
  exports: [WbsService],
})
export class WbsModule {}
