import { Inject, Injectable } from '@nestjs/common';
import { UpdateLeadStatusDto } from '../../infrastructure/dto/update-lead-status.dto';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';
import LeadsPermissionService from '../services/leads-permission.service';

@Injectable()
export class UpdateLeadStatusUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepo: ILeadRepository,
    private readonly permission: LeadsPermissionService,
  ) {}

  async execute(dto: UpdateLeadStatusDto) {
    await this.permission.ensureEmpresaActor(dto.usuarioEmpresaId);
    const updated = await this.leadRepo.update(dto.leadId, {
      id_estado_lead: dto.id_estado_lead,
    });
    return updated;
  }
}

export default UpdateLeadStatusUseCase;
