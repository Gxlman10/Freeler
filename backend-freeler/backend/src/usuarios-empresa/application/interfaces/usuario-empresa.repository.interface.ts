import { PaginationDto } from '../../../shared/application/dto/pagination.dto';
import { UsuarioEmpresaEntity } from '../../infrastructure/entities/usuario-empresa.entity';

export const USUARIO_EMPRESA_REPOSITORY = Symbol('USUARIO_EMPRESA_REPOSITORY');

export interface IUsuarioEmpresaRepository {
  create(data: Partial<UsuarioEmpresaEntity>): Promise<UsuarioEmpresaEntity>;
  findById(id: number): Promise<UsuarioEmpresaEntity | null>;
  findByEmail(email: string): Promise<UsuarioEmpresaEntity | null>;
  update(id: number, data: Partial<UsuarioEmpresaEntity>): Promise<UsuarioEmpresaEntity>;
  paginate(pagination: PaginationDto): Promise<{ data: UsuarioEmpresaEntity[]; total: number }>;
  softDelete(id: number): Promise<void>;
}

export type { UsuarioEmpresaEntity as UsuarioEmpresa };
