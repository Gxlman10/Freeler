import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import IaConfigEntity from './infrastructure/entities/ia-config.entity';
import IaConfigService from './application/services/ia-config.service';
import IaConfigController from './presentation/ia-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IaConfigEntity])],
  controllers: [IaConfigController],
  providers: [IaConfigService],
})
export class IaConfigModule {}

export default IaConfigModule;
