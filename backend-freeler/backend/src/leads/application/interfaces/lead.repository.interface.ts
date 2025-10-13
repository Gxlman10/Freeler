import { LeadEntity } from '../../infrastructure/entities/lead.entity';
import { FindLeadsDto } from '../../infrastructure/dto/find-leads.dto';

export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');

export interface ILeadRepository {
  create(data: Partial<LeadEntity>): Promise<LeadEntity>;
  findById(id: number): Promise<LeadEntity | null>;
  update(id: number, data: Partial<LeadEntity>): Promise<LeadEntity>;
  paginate(
    filters: FindLeadsDto,
  ): Promise<{ data: LeadEntity[]; total: number }>;
}

export type { LeadEntity as Lead };
