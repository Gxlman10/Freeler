import { CampanaEntity } from '../../infrastructure/entities/campana.entity';
import { FindCampanasDto } from '../../infrastructure/dto/find-campanas.dto';

export const CAMPANA_REPOSITORY = Symbol('CAMPANA_REPOSITORY');

export interface ICampanaRepository {
  create(data: Partial<CampanaEntity>): Promise<CampanaEntity>;
  findById(id: number): Promise<CampanaEntity | null>;
  update(id: number, data: Partial<CampanaEntity>): Promise<CampanaEntity>;
  paginate(
    filters: FindCampanasDto,
  ): Promise<{ data: CampanaEntity[]; total: number }>;
  softDelete(id: number): Promise<void>;
}

export type { CampanaEntity as Campana };
