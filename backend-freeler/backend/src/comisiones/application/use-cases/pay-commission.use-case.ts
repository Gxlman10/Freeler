import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';
import { ComisionRetiroEntity } from '../../infrastructure/entities/comision-retiro.entity';
import CommissionAccountingService, {
  COMISION_ESTADO_PAGADA,
  COMISION_ESTADO_SOLICITADA,
} from '../services/commission-accounting.service';

@Injectable()
export class PayCommissionUseCase {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly repo: IComisionRepository,
    @InjectRepository(ComisionRetiroEntity)
    private readonly retiroRepo: Repository<ComisionRetiroEntity>,
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

    const latestRequest = await this.retiroRepo.findOne({
      where: { id_comision: id },
      order: { id_retiro: 'DESC' },
    });
    if (latestRequest) {
      await this.retiroRepo.update(latestRequest.id_retiro, {
        estado: isPagado ? 'pagado' : 'pendiente',
        fecha_resolucion: isPagado ? new Date() : null,
      });
    }

    return updated;
  }
}

export default PayCommissionUseCase;
