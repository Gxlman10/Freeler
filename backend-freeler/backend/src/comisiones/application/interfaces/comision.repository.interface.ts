import { ComisionEntity } from '../../infrastructure/entities/comision.entity';
import FindComisionesDto from '../../infrastructure/dto/find-comisiones.dto';

export const COMISION_REPOSITORY = Symbol('COMISION_REPOSITORY');

export interface IComisionRepository {
  create(data: Partial<ComisionEntity>): Promise<ComisionEntity>;
  findById(id: number): Promise<ComisionEntity | null>;
  findByLeadId(leadId: number): Promise<ComisionEntity | null>;
  update(id: number, data: Partial<ComisionEntity>): Promise<ComisionEntity>;
  paginate(
    filters: FindComisionesDto,
  ): Promise<{ data: ComisionEntity[]; total: number }>;
}

export type { ComisionEntity as Comision };
