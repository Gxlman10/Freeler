import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ILeadRepository,
  LEAD_REPOSITORY,
} from '../interfaces/lead.repository.interface';

@Injectable()
export class FindLeadByIdUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly repo: ILeadRepository,
  ) {}

  async execute(id: string | number) {
    const lead = await this.repo.findById(Number(id));
    if (!lead) throw new NotFoundException('LEAD_NOT_FOUND');
    return lead;
  }
}

export default FindLeadByIdUseCase;
