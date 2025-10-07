import { Inject, Injectable } from '@nestjs/common';
import { UpdateEmpresaDto } from '../../infrastructure/dto/update-empresa.dto';
import {
  EMPRESA_REPOSITORY,
  IEmpresaRepository,
} from '../interfaces/empresa.repository.interface';

@Injectable()
export class UpdateEmpresaUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly repo: IEmpresaRepository,
  ) {}

  execute(id: number, dto: UpdateEmpresaDto) {
    return this.repo.update(id, dto);
  }
}

export default UpdateEmpresaUseCase;
