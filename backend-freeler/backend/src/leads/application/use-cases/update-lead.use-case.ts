import { Inject, Injectable } from '@nestjs/common';
import {
  LEAD_REPOSITORY,
  ILeadRepository,
} from '../interfaces/lead.repository.interface';
import { UpdateLeadDto } from '../../infrastructure/dto/update-lead.dto';

@Injectable()
export class UpdateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly repo: ILeadRepository,
  ) {}

  execute(id: number, dto: UpdateLeadDto) {
    return this.repo.update(id, dto);
  }
}

export default UpdateLeadUseCase;
