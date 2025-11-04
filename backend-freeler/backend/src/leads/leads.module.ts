import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosEmpresaModule } from '../usuarios-empresa/usuarios-empresa.module';
import { ComisionesModule } from '../comisiones/comisiones.module';
import { LeadsController } from './presentation/leads.controller';
import { LEAD_REPOSITORY } from './application/interfaces/lead.repository.interface';
import { CreateLeadDraftUseCase } from './application/use-cases/create-lead-draft.use-case';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { UpdateLeadUseCase } from './application/use-cases/update-lead.use-case';
import { FindLeadsByUserUseCase } from './application/use-cases/find-leads-by-user.use-case';
import { FindLeadsByCampaignUseCase } from './application/use-cases/find-leads-by-campaign.use-case';
import { FindLeadsByEmpresaUseCase } from './application/use-cases/find-leads-by-empresa.use-case';
import { AssignLeadUseCase } from './application/use-cases/assign-lead.use-case';
import { UpdateAsignacionUseCase } from './application/use-cases/update-asignacion.use-case';
import { BulkUpdateAsignacionesUseCase } from './application/use-cases/bulk-update-asignaciones.use-case';
import { UpdateLeadStatusUseCase } from './application/use-cases/update-lead-status.use-case';
import { MarkLeadAsSoldUseCase } from './application/use-cases/mark-lead-as-sold.use-case';
import { FindLeadByIdUseCase } from './application/use-cases/find-lead-by-id.use-case';
import LeadsPermissionService from './application/services/leads-permission.service';
import { LeadEntity } from './infrastructure/entities/lead.entity';
import { EstadoLeadEntity } from './infrastructure/entities/estado-lead.entity';
import { AsignacionEntity } from './infrastructure/entities/asignacion.entity';
import { TypeormLeadRepository } from './infrastructure/repositories/typeorm-lead.repository';
import { ListEstadoLeadUseCase } from './application/use-cases/list-estado-lead.use-case';
import { RefreshLeadCreatedAtUseCase } from './application/use-cases/refresh-lead-created-at.use-case';
import { CampanaEntity } from '../campanas/infrastructure/entities/campana.entity';
import { LeadImportService } from './application/services/lead-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeadEntity,
      EstadoLeadEntity,
      AsignacionEntity,
      CampanaEntity,
    ]),
    UsuariosEmpresaModule,
    ComisionesModule,
  ],
  controllers: [LeadsController],
  providers: [
    { provide: LEAD_REPOSITORY, useClass: TypeormLeadRepository },
    LeadsPermissionService,
    CreateLeadDraftUseCase,
    CreateLeadUseCase,
    UpdateLeadUseCase,
    FindLeadsByUserUseCase,
    FindLeadsByCampaignUseCase,
    FindLeadsByEmpresaUseCase,
    AssignLeadUseCase,
    UpdateAsignacionUseCase,
    BulkUpdateAsignacionesUseCase,
    UpdateLeadStatusUseCase,
    MarkLeadAsSoldUseCase,
    FindLeadByIdUseCase,
    ListEstadoLeadUseCase,
    RefreshLeadCreatedAtUseCase,
    LeadImportService,
  ],
})
export class LeadsModule {}
