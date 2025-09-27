import { Module } from '@nestjs/common';
import { EmpresasController } from './presentation/empresas.controller';

@Module({
  imports: [],
  controllers: [EmpresasController],
  providers: [],
  exports: [],
})
export class EmpresasModule {}
