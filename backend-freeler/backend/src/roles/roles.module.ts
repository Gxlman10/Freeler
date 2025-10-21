import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolEntity } from './infrastructure/entities/rol.entity';
import { RolesController } from './presentation/roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RolEntity])],
  controllers: [RolesController],
})
export class RolesModule {}
