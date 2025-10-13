import { Inject, Injectable } from '@nestjs/common';
import {
  LEAD_REPOSITORY,
  ILeadRepository,
} from '../interfaces/lead.repository.interface';
import { FindLeadsDto } from '../../infrastructure/dto/find-leads.dto';

@Injectable()
export class FindLeadsByCampaignUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly repo: ILeadRepository,
  ) {}

  execute(filters: FindLeadsDto) {
    return this.repo.paginate(filters);
  }
}

export default FindLeadsByCampaignUseCase;
