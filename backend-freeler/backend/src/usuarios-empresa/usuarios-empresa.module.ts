import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USUARIO_EMPRESA_REPOSITORY } from './application/interfaces/usuario-empresa.repository.interface';
import { CreateUsuarioEmpresaUseCase } from './application/use-cases/create-usuario-empresa.use-case';
import { FindUsuarioEmpresaUseCase } from './application/use-cases/find-usuario-empresa.use-case';
import { ListUsuariosEmpresaUseCase } from './application/use-cases/list-usuarios-empresa.use-case';
import { SoftDeleteUsuarioEmpresaUseCase } from './application/use-cases/soft-delete-usuario-empresa.use-case';
import { UpdateUsuarioEmpresaUseCase } from './application/use-cases/update-usuario-empresa.use-case';
import { UsuarioEmpresaEntity } from './infrastructure/entities/usuario-empresa.entity';
import { TypeormUsuarioEmpresaRepository } from './infrastructure/repositories/typeorm-usuario-empresa.repository';
import { UsuariosEmpresaController } from './presentation/usuarios-empresa.controller';
import { EmpresaEntity } from '../empresas/infrastructure/entities/empresa.entity';
import { RolEntity } from '../roles/infrastructure/entities/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioEmpresaEntity, EmpresaEntity, RolEntity]),
  ],
  controllers: [UsuariosEmpresaController],
  providers: [
    {
      provide: USUARIO_EMPRESA_REPOSITORY,
      useClass: TypeormUsuarioEmpresaRepository,
    },
    CreateUsuarioEmpresaUseCase,
    FindUsuarioEmpresaUseCase,
    ListUsuariosEmpresaUseCase,
    UpdateUsuarioEmpresaUseCase,
    SoftDeleteUsuarioEmpresaUseCase,
  ],
  exports: [USUARIO_EMPRESA_REPOSITORY, CreateUsuarioEmpresaUseCase],
})
export class UsuariosEmpresaModule {}

