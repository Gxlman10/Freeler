import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';
import RequestCommissionPayoutUseCase from './request-commission-payout.use-case';
import RequestCommissionPayoutDto from '../../infrastructure/dto/request-commission-payout.dto';

@Injectable()
export class RequestFreelerMassPayoutUseCase {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly repo: IComisionRepository,
    private readonly singleRequestUC: RequestCommissionPayoutUseCase,
  ) {}

  async execute(
    freelerId: number,
    dto: RequestCommissionPayoutDto & { commissionIds?: number[] },
  ) {
    const targetIds = dto.commissionIds?.length ? dto.commissionIds : undefined;
    const pending = await this.repo.findPendingByFreeler(freelerId, targetIds);
    if (!pending.length) {
      throw new BadRequestException('NO_PENDING_COMMISSIONS');
    }
    for (const commission of pending) {
      await this.singleRequestUC.execute(commission.id_comision, freelerId, dto);
    }
    return { ok: true, requested: pending.length };
  }
}

export default RequestFreelerMassPayoutUseCase;
