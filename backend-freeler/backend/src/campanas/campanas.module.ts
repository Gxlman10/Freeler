import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosEmpresaModule } from '../usuarios-empresa/usuarios-empresa.module';
import { CAMPANA_REPOSITORY } from './application/interfaces/campana.repository.interface';
import { CreateCampanaUseCase } from './application/use-cases/create-campana.use-case';
import { DeleteCampanaUseCase } from './application/use-cases/delete-campana.use-case';
import { FindCampanaByIdUseCase } from './application/use-cases/find-campana-by-id.use-case';
import { FindCampanasUseCase } from './application/use-cases/find-campanas.use-case';
import { GetCampanaStatsUseCase } from './application/use-cases/get-campana-stats.use-case';
import { UpdateCampanaUseCase } from './application/use-cases/update-campana.use-case';
import { CampanaPermissionService } from './application/services/campana-permission.service';
import { CampanaEntity } from './infrastructure/entities/campana.entity';
import { TypeormCampanaRepository } from './infrastructure/repositories/typeorm-campana.repository';
import { CampanasController } from './presentation/campanas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CampanaEntity]), UsuariosEmpresaModule],
  controllers: [CampanasController],
  providers: [
    { provide: CAMPANA_REPOSITORY, useClass: TypeormCampanaRepository },
    CampanaPermissionService,
    CreateCampanaUseCase,
    FindCampanasUseCase,
    FindCampanaByIdUseCase,
    UpdateCampanaUseCase,
    DeleteCampanaUseCase,
    GetCampanaStatsUseCase,
  ],
})
export class CampanasModule {}
