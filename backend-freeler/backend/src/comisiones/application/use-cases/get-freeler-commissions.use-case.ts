import { Inject, Injectable } from '@nestjs/common';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';

export type FreelerCommissionSummary = {
  totals: {
    pendiente: number;
    solicitada: number;
    pagada: number;
  };
  byCampaign: Array<{
    id_campania: number | null;
    nombre: string;
    pendiente: number;
    pagada: number;
    total: number;
  }>;
  commissions: Awaited<ReturnType<IComisionRepository['findManyByFreeler']>>;
};

@Injectable()
export class GetFreelerCommissionsUseCase {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly repo: IComisionRepository,
  ) {}

  async execute(freelerId: number): Promise<FreelerCommissionSummary> {
    const commissions = await this.repo.findManyByFreeler(freelerId);
    const totals = {
      pendiente: 0,
      solicitada: 0,
      pagada: 0,
    };
    const byCampaignMap = new Map<
      number | null,
      { nombre: string; pendiente: number; pagada: number; total: number }
    >();

    commissions.forEach((commission) => {
      const amount = Number(commission.monto ?? 0);
      const status = Number(commission.id_estado_comision ?? 1);
      if (status === 3) {
        totals.pagada += amount;
      } else if (status === 2) {
        totals.solicitada += amount;
      } else {
        totals.pendiente += amount;
      }

      const campId = commission.id_campania ?? null;
      const entry =
        byCampaignMap.get(campId) ??
        byCampaignMap.set(campId, {
          nombre: commission.campania?.nombre ?? 'Sin campaña',
          pendiente: 0,
          pagada: 0,
          total: 0,
        }).get(campId)!;
      entry.total += amount;
      if (status === 3) {
        entry.pagada += amount;
      } else {
        entry.pendiente += amount;
      }
    });

    return {
      totals,
      byCampaign: Array.from(byCampaignMap.entries()).map(([id, payload]) => ({
        id_campania: id,
        ...payload,
      })),
      commissions,
    };
  }
}

export default GetFreelerCommissionsUseCase;
