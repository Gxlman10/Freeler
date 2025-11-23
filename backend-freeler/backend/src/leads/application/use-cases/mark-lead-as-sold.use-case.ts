import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import LeadsPermissionService from '../services/leads-permission.service';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';
import { MarkLeadSoldDto } from '../../infrastructure/dto/mark-lead-sold.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AsignacionEntity } from '../../infrastructure/entities/asignacion.entity';
import { Repository } from 'typeorm';
import CommissionAccountingService, {
  LEAD_ESTADO_GANADO,
} from '../../../comisiones/application/services/commission-accounting.service';

@Injectable()
export class MarkLeadAsSoldUseCase {
  constructor(
    private readonly permission: LeadsPermissionService,
    @Inject(LEAD_REPOSITORY) private readonly leadRepo: ILeadRepository,
    @InjectRepository(AsignacionEntity)
    private readonly asignRepo: Repository<AsignacionEntity>,
    private readonly commissionAccounting: CommissionAccountingService,
  ) {}

  async execute(dto: MarkLeadSoldDto) {
    await this.permission.ensureEmpresaActor(dto.usuarioEmpresaId);
    const lead = await this.leadRepo.findById(dto.leadId);
    if (!lead) throw new NotFoundException('LEAD_NOT_FOUND');

    await this.leadRepo.update(dto.leadId, { id_estado_lead: LEAD_ESTADO_GANADO });
    await this.asignRepo
      .createQueryBuilder()
      .update(AsignacionEntity)
      .set({ id_estado_lead: LEAD_ESTADO_GANADO })
      .where({ id_lead: dto.leadId, estado: 1 })
      .execute();

    return this.commissionAccounting.ensureCommissionForLead({
      ...lead,
      id_estado_lead: LEAD_ESTADO_GANADO,
    });
  }
}

export default MarkLeadAsSoldUseCase;
