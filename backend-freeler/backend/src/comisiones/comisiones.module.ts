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
import { UsuariosFreelerModule } from '../usuarios-freeler/usuarios-freeler.module';
import CommissionAccountingService from './application/services/commission-accounting.service';
import RequestCommissionPayoutUseCase from './application/use-cases/request-commission-payout.use-case';
import RequestFreelerMassPayoutUseCase from './application/use-cases/request-freeler-mass-payout.use-case';
import GetFreelerCommissionsUseCase from './application/use-cases/get-freeler-commissions.use-case';
import { ComisionSolicitudEntity } from './infrastructure/entities/comision-solicitud.entity';
import { CampanaEntity } from '../campanas/infrastructure/entities/campana.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComisionEntity, EstadoComisionEntity, ComisionSolicitudEntity, CampanaEntity]),
    UsuariosFreelerModule,
  ],
  controllers: [ComisionesController],
  providers: [
    { provide: COMISION_REPOSITORY, useClass: TypeormComisionRepository },
    PayCommissionUseCase,
    ListComisionesUseCase,
    FindComisionByIdUseCase,
    GetComisionesStatsUseCase,
    CommissionAccountingService,
    RequestCommissionPayoutUseCase,
    RequestFreelerMassPayoutUseCase,
    GetFreelerCommissionsUseCase,
  ],
  exports: [COMISION_REPOSITORY, CommissionAccountingService],
})
export class ComisionesModule {}
