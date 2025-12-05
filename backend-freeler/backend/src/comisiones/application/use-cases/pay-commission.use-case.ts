import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';
import { ComisionSolicitudEntity } from '../../infrastructure/entities/comision-solicitud.entity';
import CommissionAccountingService, {
  COMISION_ESTADO_PAGADA,
  COMISION_ESTADO_SOLICITADA,
} from '../services/commission-accounting.service';

@Injectable()
export class PayCommissionUseCase {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly repo: IComisionRepository,
    @InjectRepository(ComisionSolicitudEntity)
    private readonly solicitudRepo: Repository<ComisionSolicitudEntity>,
    private readonly accounting: CommissionAccountingService,
  ) {}

  async execute(id: number, estado: 'pagado' | 'pendiente' = 'pagado') {
    const comision = await this.repo.findById(id);
    if (!comision) throw new NotFoundException('COMISION_NOT_FOUND');

    const previousState = Number(comision.id_estado_comision ?? 0);
    const monto = Number(comision.monto ?? 0);
    const isPagado = estado === 'pagado';
    const nextState = isPagado ? COMISION_ESTADO_PAGADA : COMISION_ESTADO_SOLICITADA;

    const updated = await this.repo.update(id, {
      id_estado_comision: nextState,
      fecha_pago: isPagado ? new Date() : null,
    });

    if (comision.id_usuario_freeler && Number.isFinite(monto) && monto > 0) {
      if (isPagado && previousState !== COMISION_ESTADO_PAGADA) {
        await this.accounting.adjustFreelerBalance(comision.id_usuario_freeler, -monto);
      }
      if (!isPagado && previousState === COMISION_ESTADO_PAGADA) {
        await this.accounting.adjustFreelerBalance(comision.id_usuario_freeler, monto);
      }
    }

    const latestRequest = await this.solicitudRepo.findOne({
      where: { id_comision: id },
      order: { id_solicitud: 'DESC' },
    });
    if (latestRequest) {
      await this.solicitudRepo.update(latestRequest.id_solicitud, {
        estado: isPagado ? 'pagada' : 'pendiente',
        fecha_resolucion: isPagado ? new Date() : null,
      });
    }

    return updated;
  }
}

export default PayCommissionUseCase;
