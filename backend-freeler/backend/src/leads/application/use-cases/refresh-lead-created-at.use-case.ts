import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';

type RefreshLeadCreatedAtParams = {
  actorId?: number;
  actorType?: 'freeler' | 'empresa';
};

@Injectable()
export class RefreshLeadCreatedAtUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly repo: ILeadRepository,
  ) {}

  async execute(id: number, params: RefreshLeadCreatedAtParams = {}) {
    if (params.actorType === 'freeler' && params.actorId) {
      const lead = await this.repo.findById(id);
      if (!lead) throw new NotFoundException('NOT_FOUND');
      if (lead.id_usuario_freeler !== params.actorId) {
        throw new ForbiddenException('FORBIDDEN');
      }
    }
    const updated = await this.repo.refreshCreatedAt(id);
    if (!updated) throw new NotFoundException('NOT_FOUND');
    return updated;
  }
}

export default RefreshLeadCreatedAtUseCase;
