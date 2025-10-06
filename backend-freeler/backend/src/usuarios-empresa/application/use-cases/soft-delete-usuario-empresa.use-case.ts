import { Inject, Injectable } from '@nestjs/common';
import { IUsuarioEmpresaRepository, USUARIO_EMPRESA_REPOSITORY } from '../interfaces/usuario-empresa.repository.interface';

@Injectable()
export class SoftDeleteUsuarioEmpresaUseCase {
  constructor(
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly repo: IUsuarioEmpresaRepository,
  ) {}

  async execute(id: number) {
    await this.repo.softDelete(id);
    return { ok: true };
  }
}

export default SoftDeleteUsuarioEmpresaUseCase;
