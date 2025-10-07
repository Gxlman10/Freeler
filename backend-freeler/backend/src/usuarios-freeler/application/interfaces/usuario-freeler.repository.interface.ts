import { UsuarioFreelerEntity } from '../../infrastructure/entities/usuario-freeler.entity';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';

export const USUARIO_FREELER_REPOSITORY = Symbol('USUARIO_FREELER_REPOSITORY');

export interface IUsuarioFreelerRepository {
  create(data: Partial<UsuarioFreelerEntity>): Promise<UsuarioFreelerEntity>;
  findById(id: number): Promise<UsuarioFreelerEntity | null>;
  findByEmail(email: string): Promise<UsuarioFreelerEntity | null>;
  findByDni(dni: string): Promise<UsuarioFreelerEntity | null>;
  update(
    id: number,
    data: Partial<UsuarioFreelerEntity>,
  ): Promise<UsuarioFreelerEntity>;
  paginate(
    pagination: PaginationDto,
  ): Promise<{ data: UsuarioFreelerEntity[]; total: number }>;
  softDelete(id: number): Promise<void>;
}

export type { UsuarioFreelerEntity as UsuarioFreeler };
