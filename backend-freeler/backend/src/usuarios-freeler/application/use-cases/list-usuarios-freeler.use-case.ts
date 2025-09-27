import { Inject, Injectable } from '@nestjs/common';
import { IUsuarioFreelerRepository, USUARIO_FREELER_REPOSITORY } from '../interfaces/usuario-freeler.repository.interface';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';

@Injectable()
export class ListUsuariosFreelerUseCase {
  constructor(
    @Inject(USUARIO_FREELER_REPOSITORY)
    private readonly repo: IUsuarioFreelerRepository,
  ) {}

  execute(pagination: PaginationDto) {
    return this.repo.paginate(pagination);
  }
}
export default ListUsuariosFreelerUseCase;
