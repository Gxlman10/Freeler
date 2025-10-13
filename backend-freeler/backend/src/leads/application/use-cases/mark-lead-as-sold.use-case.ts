import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import LeadsPermissionService from '../services/leads-permission.service';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../../../comisiones/application/interfaces/comision.repository.interface';
import { MarkLeadSoldDto } from '../../infrastructure/dto/mark-lead-sold.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CampanaEntity } from '../../../campanas/infrastructure/entities/campana.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MarkLeadAsSoldUseCase {
  constructor(
    private readonly permission: LeadsPermissionService,
    @Inject(LEAD_REPOSITORY) private readonly leadRepo: ILeadRepository,
    @Inject(COMISION_REPOSITORY) private readonly comRepo: IComisionRepository,
    @InjectRepository(CampanaEntity)
    private readonly campRepo: Repository<CampanaEntity>,
  ) {}

  async execute(dto: MarkLeadSoldDto) {
    await this.permission.ensureEmpresaActor(dto.usuarioEmpresaId);
    const lead = await this.leadRepo.findById(dto.leadId);
    if (!lead) throw new NotFoundException('LEAD_NOT_FOUND');
    // Obtener comision desde campaña
    const camp = lead.id_campania
      ? await this.campRepo.findOne({
          where: { id_campania: lead.id_campania },
        })
      : null;
    if (!camp) throw new NotFoundException('CAMPANIA_NOT_FOUND');

    // Actualizar estado del lead a GANADO (2)
    await this.leadRepo.update(dto.leadId, { id_estado_lead: 2 });

    // Evitar duplicar comisión por lead
    const existing = await this.comRepo.findByLeadId(dto.leadId);
    if (existing) return existing;

    const created = await this.comRepo.create({
      id_lead: dto.leadId,
      id_usuario_freeler: lead.id_usuario_freeler ?? null,
      id_campania: lead.id_campania ?? null,
      monto: camp.comision,
      id_estado_comision: 2, // Por Cobrar
      fecha_pago: null,
    });
    return created;
  }
}

export default MarkLeadAsSoldUseCase;
