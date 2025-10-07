import { Inject, Injectable } from '@nestjs/common';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';
import {
  IUsuarioEmpresaRepository,
  USUARIO_EMPRESA_REPOSITORY,
} from '../interfaces/usuario-empresa.repository.interface';

@Injectable()
export class ListUsuariosEmpresaUseCase {
  constructor(
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly repo: IUsuarioEmpresaRepository,
  ) {}

  execute(pagination: PaginationDto) {
    return this.repo.paginate(pagination);
  }
}

export default ListUsuariosEmpresaUseCase;
