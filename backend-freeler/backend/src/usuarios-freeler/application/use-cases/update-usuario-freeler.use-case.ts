import { Inject, Injectable } from '@nestjs/common';
import { UpdateUsuarioFreelerDto } from '../../infrastructure/dto/update-usuario-freeler.dto';
import { IUsuarioFreelerRepository, USUARIO_FREELER_REPOSITORY } from '../interfaces/usuario-freeler.repository.interface';

@Injectable()
export class UpdateUsuarioFreelerUseCase {
  constructor(
    @Inject(USUARIO_FREELER_REPOSITORY)
    private readonly repo: IUsuarioFreelerRepository,
  ) {}

  async execute(id: number, dto: UpdateUsuarioFreelerDto) {
    const updated = await this.repo.update(id, dto);
    const { password, ...safe } = updated as any;
    return safe;
  }
}
export default UpdateUsuarioFreelerUseCase;
