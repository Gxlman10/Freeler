import { Module } from '@nestjs/common';
import { AsignacionesController } from './presentation/asignaciones.controller';

@Module({
  imports: [],
  controllers: [AsignacionesController],
  providers: [],
  exports: [],
})
export class AsignacionesModule {}
