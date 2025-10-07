import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  EMPRESA_REPOSITORY,
  IEmpresaRepository,
} from '../interfaces/empresa.repository.interface';

@Injectable()
export class FindEmpresaUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly repo: IEmpresaRepository,
  ) {}

  async byId(id: string | number) {
    const empresa = await this.repo.findById(Number(id));
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }
}

export default FindEmpresaUseCase;
