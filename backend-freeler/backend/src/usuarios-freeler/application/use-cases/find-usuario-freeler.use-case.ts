import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUsuarioFreelerRepository,
  USUARIO_FREELER_REPOSITORY,
} from '../interfaces/usuario-freeler.repository.interface';

@Injectable()
export class FindUsuarioFreelerUseCase {
  constructor(
    @Inject(USUARIO_FREELER_REPOSITORY)
    private readonly repo: IUsuarioFreelerRepository,
  ) {}

  async byId(id: string | number) {
    const user = await this.repo.findById(Number(id));
    if (!user) throw new NotFoundException('Usuario Freeler no encontrado');
    const { password: _password, ...safe } = user;
    void _password;
    return safe;
  }
}
export default FindUsuarioFreelerUseCase;
