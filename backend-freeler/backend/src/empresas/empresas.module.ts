import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EMPRESA_REPOSITORY } from './application/interfaces/empresa.repository.interface';
import { CreateEmpresaUseCase } from './application/use-cases/create-empresa.use-case';
import { FindEmpresaUseCase } from './application/use-cases/find-empresa.use-case';
import { ListEmpresasUseCase } from './application/use-cases/list-empresas.use-case';
import { SoftDeleteEmpresaUseCase } from './application/use-cases/soft-delete-empresa.use-case';
import { UpdateEmpresaUseCase } from './application/use-cases/update-empresa.use-case';
import { EmpresaEntity } from './infrastructure/entities/empresa.entity';
import { TypeormEmpresaRepository } from './infrastructure/repositories/typeorm-empresa.repository';
import { EmpresasController } from './presentation/empresas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmpresaEntity])],
  controllers: [EmpresasController],
  providers: [
    { provide: EMPRESA_REPOSITORY, useClass: TypeormEmpresaRepository },
    CreateEmpresaUseCase,
    FindEmpresaUseCase,
    ListEmpresasUseCase,
    UpdateEmpresaUseCase,
    SoftDeleteEmpresaUseCase,
  ],
  exports: [CreateEmpresaUseCase],
})
export class EmpresasModule {}
