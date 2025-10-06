import { Inject, Injectable } from '@nestjs/common';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';
import { EMPRESA_REPOSITORY, IEmpresaRepository } from '../interfaces/empresa.repository.interface';

@Injectable()
export class ListEmpresasUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly repo: IEmpresaRepository,
  ) {}

  execute(pagination: PaginationDto) {
    return this.repo.paginate(pagination);
  }
}

export default ListEmpresasUseCase;
