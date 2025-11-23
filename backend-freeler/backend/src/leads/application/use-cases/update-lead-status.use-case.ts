import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateLeadStatusDto } from '../../infrastructure/dto/update-lead-status.dto';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';
import LeadsPermissionService from '../services/leads-permission.service';
import { AsignacionEntity } from '../../infrastructure/entities/asignacion.entity';
import CommissionAccountingService, {
  LEAD_ESTADO_GANADO,
} from '../../../comisiones/application/services/commission-accounting.service';

@Injectable()
export class UpdateLeadStatusUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepo: ILeadRepository,
    private readonly permission: LeadsPermissionService,
    @InjectRepository(AsignacionEntity)
    private readonly asignRepo: Repository<AsignacionEntity>,
    private readonly commissionAccounting: CommissionAccountingService,
  ) {}

  async execute(dto: UpdateLeadStatusDto) {
    const actor = await this.permission.ensureEmpresaActor(dto.usuarioEmpresaId);
    const lead = await this.leadRepo.findById(dto.leadId);
    if (!lead) throw new NotFoundException('LEAD_NOT_FOUND');

    const activeAssignment = await this.asignRepo.findOne({
      where: { id_lead: dto.leadId, estado: 1 },
      order: { fecha_asignacion: 'DESC' },
    });

    if (!activeAssignment) {
      throw new ForbiddenException('LEAD_SIN_VENDEDOR_ASIGNADO');
    }

    const roleName = actor.rol?.nombre?.toLowerCase();
    if (
      roleName === 'vendedor' &&
      activeAssignment.id_asignado_usuario_empresa !== actor.id_usuario_empresa
    ) {
      throw new ForbiddenException('LEAD_NO_ASIGNADO_AL_VENDEDOR');
    }

    // Actualizamos el id_estado_lead en el registro histórico de la asignación
    await this.asignRepo.update(
      { id_asignacion: activeAssignment.id_asignacion },
      { id_estado_lead: dto.id_estado_lead },
    );

    const updated = await this.leadRepo.update(dto.leadId, {
      id_estado_lead: dto.id_estado_lead,
    });
    if (dto.id_estado_lead === LEAD_ESTADO_GANADO) {
      await this.commissionAccounting.ensureCommissionForLead({
        ...lead,
        id_estado_lead: LEAD_ESTADO_GANADO,
      });
    }
    return updated;
  }
}

export default UpdateLeadStatusUseCase;
