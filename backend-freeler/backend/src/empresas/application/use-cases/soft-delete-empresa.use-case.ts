import { Inject, Injectable } from '@nestjs/common';
import { EMPRESA_REPOSITORY, IEmpresaRepository } from '../interfaces/empresa.repository.interface';

@Injectable()
export class SoftDeleteEmpresaUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly repo: IEmpresaRepository,
  ) {}

  async execute(id: number) {
    await this.repo.softDelete(id);
    return { ok: true };
  }
}

export default SoftDeleteEmpresaUseCase;
