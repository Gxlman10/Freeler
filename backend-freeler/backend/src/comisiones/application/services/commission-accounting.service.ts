import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';
import {
  IUsuarioFreelerRepository,
  USUARIO_FREELER_REPOSITORY,
} from '../../../usuarios-freeler/application/interfaces/usuario-freeler.repository.interface';
import { CampanaEntity } from '../../../campanas/infrastructure/entities/campana.entity';
import { Lead } from '../../../leads/application/interfaces/lead.repository.interface';

export const COMISION_ESTADO_GENERADA = 1;
export const COMISION_ESTADO_SOLICITADA = 2;
export const COMISION_ESTADO_PAGADA = 3;
export const LEAD_ESTADO_GANADO = 6;

@Injectable()
export class CommissionAccountingService {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly comisiones: IComisionRepository,
    @Inject(USUARIO_FREELER_REPOSITORY)
    private readonly freelerRepo: IUsuarioFreelerRepository,
    @InjectRepository(CampanaEntity)
    private readonly campanaRepo: Repository<CampanaEntity>,
  ) {}

  async ensureCommissionForLead(lead: Lead) {
    if (!lead) throw new NotFoundException('LEAD_NOT_FOUND');
    const origin = lead.origen?.trim().toLowerCase();
    if (!lead.id_lead || !lead.id_usuario_freeler || origin !== 'freeler') {
      return null;
    }

    const existing = await this.comisiones.findByLeadId(lead.id_lead);
    if (existing) return existing;

    const campaniaId = lead.id_campania;
    if (!campaniaId) return null;
    const campania = await this.campanaRepo.findOne({
      where: { id_campania: campaniaId },
    });
    if (!campania?.comision) return null;

    const monto = Number(campania.comision);
    if (!Number.isFinite(monto) || monto <= 0) return null;

    const created = await this.comisiones.create({
      id_lead: lead.id_lead,
      id_usuario_freeler: lead.id_usuario_freeler,
      id_campania: campaniaId,
      monto: campania.comision,
      id_estado_comision: COMISION_ESTADO_GENERADA,
      fecha_pago: null,
    });
    await this.adjustFreelerBalance(lead.id_usuario_freeler, monto);
    return created;
  }

  async adjustFreelerBalance(freelerId: number, delta: number) {
    const freeler = await this.freelerRepo.findById(freelerId);
    if (!freeler) return null;
    const current = Number(freeler.saldo ?? 0);
    const next = (current + delta).toFixed(2);
    return this.freelerRepo.update(freelerId, { saldo: next });
  }
}

export default CommissionAccountingService;
