import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUsuarioEmpresaRepository,
  USUARIO_EMPRESA_REPOSITORY,
} from '../interfaces/usuario-empresa.repository.interface';

@Injectable()
export class FindUsuarioEmpresaUseCase {
  constructor(
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly repo: IUsuarioEmpresaRepository,
  ) {}

  async byId(id: string | number) {
    const user = await this.repo.findById(Number(id));
    if (!user) throw new NotFoundException('Usuario Empresa no encontrado');
    const { password: _password, ...safe } = user;
    void _password;
    return safe;
  }
}

export default FindUsuarioEmpresaUseCase;
