import { Module } from '@nestjs/common';
import { UsuariosEmpresaController } from './presentation/usuarios-empresa.controller';

@Module({
  imports: [],
  controllers: [UsuariosEmpresaController],
  providers: [],
  exports: [],
})
export class UsuariosEmpresaModule {}
