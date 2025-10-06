import { PaginationDto } from '../../../shared/application/dto/pagination.dto';
import { EmpresaEntity } from '../../infrastructure/entities/empresa.entity';

export const EMPRESA_REPOSITORY = Symbol('EMPRESA_REPOSITORY');

export interface IEmpresaRepository {
  create(data: Partial<EmpresaEntity>): Promise<EmpresaEntity>;
  findById(id: number): Promise<EmpresaEntity | null>;
  findByRuc(ruc: string): Promise<EmpresaEntity | null>;
  findByEmail(email: string): Promise<EmpresaEntity | null>;
  update(id: number, data: Partial<EmpresaEntity>): Promise<EmpresaEntity>;
  paginate(pagination: PaginationDto): Promise<{ data: EmpresaEntity[]; total: number }>;
  softDelete(id: number): Promise<void>;
}

export type { EmpresaEntity as Empresa };
