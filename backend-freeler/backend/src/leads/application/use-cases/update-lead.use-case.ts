import { Inject, Injectable } from '@nestjs/common';
import {
  LEAD_REPOSITORY,
  ILeadRepository,
} from '../interfaces/lead.repository.interface';
import { UpdateLeadDto } from '../../infrastructure/dto/update-lead.dto';
import { LeadEntity } from '../../infrastructure/entities/lead.entity';

@Injectable()
export class UpdateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly repo: ILeadRepository,
  ) {}

  execute(id: number, dto: UpdateLeadDto) {
    const { usuarioFreelerId, ...rest } = dto;
    const payload: Partial<LeadEntity> = {
      ...rest,
      ...(usuarioFreelerId !== undefined
        ? { id_usuario_freeler: usuarioFreelerId }
        : {}),
    };

    return this.repo.update(id, payload);
  }
}

export default UpdateLeadUseCase;
