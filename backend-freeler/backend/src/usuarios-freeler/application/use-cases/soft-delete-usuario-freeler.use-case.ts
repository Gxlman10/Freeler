import { Inject, Injectable } from '@nestjs/common';
import {
  IUsuarioFreelerRepository,
  USUARIO_FREELER_REPOSITORY,
} from '../interfaces/usuario-freeler.repository.interface';

@Injectable()
export class SoftDeleteUsuarioFreelerUseCase {
  constructor(
    @Inject(USUARIO_FREELER_REPOSITORY)
    private readonly repo: IUsuarioFreelerRepository,
  ) {}

  async execute(id: number) {
    await this.repo.softDelete(id);
    return { ok: true };
  }
}
export default SoftDeleteUsuarioFreelerUseCase;
