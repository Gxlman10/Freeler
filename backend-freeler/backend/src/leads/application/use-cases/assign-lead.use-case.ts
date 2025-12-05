import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignLeadDto } from '../../infrastructure/dto/assign-lead.dto';
import LeadsPermissionService from '../services/leads-permission.service';
import { AsignacionEntity } from '../../infrastructure/entities/asignacion.entity';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';

@Injectable()
export class AssignLeadUseCase {
  private readonly pendingStatusId = 1;
  private readonly assignedStatusId = 2;

  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepo: ILeadRepository,
    private readonly permission: LeadsPermissionService,
    @InjectRepository(AsignacionEntity)
    private readonly asignRepo: Repository<AsignacionEntity>,
  ) {}

  async execute(dto: AssignLeadDto) {
    const actor = await this.permission.ensureEmpresaActor(dto.usuarioEmpresaId);
    const lead = await this.leadRepo.findById(dto.leadId);
    if (!lead) throw new Error('LEAD_NOT_FOUND');

    const currentState = lead.id_estado_lead ?? this.pendingStatusId;
    const isPendingState = currentState === this.pendingStatusId;
    const storedAssignmentState = isPendingState ? this.assignedStatusId : currentState;

    // Dejamos historial y desactivamos asignaciones previas del lead
    await this.asignRepo
      .createQueryBuilder()
      .update(AsignacionEntity)
      .set({ estado: 0 })
      .where({ id_lead: dto.leadId, estado: 1 })
      .execute();

    const asign = this.asignRepo.create({
      id_lead: dto.leadId,
      id_usuario_empresa: actor.id_usuario_empresa ?? dto.usuarioEmpresaId,
      id_asignado_usuario_empresa: dto.asignarAUsuarioEmpresaId,
      id_estado_lead: storedAssignmentState,
      estado: 1,
    });
    await this.asignRepo.save(asign);
    if (isPendingState) {
      await this.leadRepo.update(dto.leadId, {
        id_estado_lead: this.assignedStatusId,
      });
    }
    return { ok: true, id_asignacion: asign.id_asignacion };
  }
}

export default AssignLeadUseCase;
