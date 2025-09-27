import { Module } from '@nestjs/common';
import { ComisionesController } from './presentation/comisiones.controller';

@Module({
  imports: [],
  controllers: [ComisionesController],
  providers: [],
  exports: [],
})
export class ComisionesModule {}
