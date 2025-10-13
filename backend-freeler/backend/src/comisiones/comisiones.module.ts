import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComisionesController } from './presentation/comisiones.controller';
import { COMISION_REPOSITORY } from './application/interfaces/comision.repository.interface';
import { ComisionEntity } from './infrastructure/entities/comision.entity';
import { EstadoComisionEntity } from './infrastructure/entities/estado-comision.entity';
import { TypeormComisionRepository } from './infrastructure/repositories/typeorm-comision.repository';
import { PayCommissionUseCase } from './application/use-cases/pay-commission.use-case';
import { ListComisionesUseCase } from './application/use-cases/list-comisiones.use-case';
import { FindComisionByIdUseCase } from './application/use-cases/find-comision-by-id.use-case';
import { GetComisionesStatsUseCase } from './application/use-cases/get-comisiones-stats.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ComisionEntity, EstadoComisionEntity])],
  controllers: [ComisionesController],
  providers: [
    { provide: COMISION_REPOSITORY, useClass: TypeormComisionRepository },
    PayCommissionUseCase,
    ListComisionesUseCase,
    FindComisionByIdUseCase,
    GetComisionesStatsUseCase,
  ],
  exports: [COMISION_REPOSITORY],
})
export class ComisionesModule {}
