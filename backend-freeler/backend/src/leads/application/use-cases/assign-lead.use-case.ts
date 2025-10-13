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
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepo: ILeadRepository,
    private readonly permission: LeadsPermissionService,
    @InjectRepository(AsignacionEntity)
    private readonly asignRepo: Repository<AsignacionEntity>,
  ) {}

  async execute(dto: AssignLeadDto) {
    await this.permission.ensureEmpresaActor(dto.usuarioEmpresaId);
    const lead = await this.leadRepo.findById(dto.leadId);
    if (!lead) throw new Error('LEAD_NOT_FOUND');
    const asign = this.asignRepo.create({
      id_lead: dto.leadId,
      id_usuario_empresa: dto.asignarAUsuarioEmpresaId,
      estado: 'activo',
    });
    await this.asignRepo.save(asign);
    return { ok: true, id_asignacion: asign.id_asignacion };
  }
}

export default AssignLeadUseCase;
