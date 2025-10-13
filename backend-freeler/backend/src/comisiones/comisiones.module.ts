import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComisionesController } from './presentation/comisiones.controller';
import { COMISION_REPOSITORY } from './application/interfaces/comision.repository.interface';
import { ComisionEntity } from './infrastructure/entities/comision.entity';
import { EstadoComisionEntity } from './infrastructure/entities/estado-comision.entity';
import { TypeormComisionRepository } from './infrastructure/repositories/typeorm-comision.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ComisionEntity, EstadoComisionEntity])],
  controllers: [ComisionesController],
  providers: [
    { provide: COMISION_REPOSITORY, useClass: TypeormComisionRepository },
    PayCommissionUseCase,
  ],
  exports: [COMISION_REPOSITORY],
})
export class ComisionesModule {}
