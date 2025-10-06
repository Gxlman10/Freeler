import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateUsuarioEmpresaDto } from '../../infrastructure/dto/update-usuario-empresa.dto';
import { IUsuarioEmpresaRepository, USUARIO_EMPRESA_REPOSITORY } from '../interfaces/usuario-empresa.repository.interface';

@Injectable()
export class UpdateUsuarioEmpresaUseCase {
  constructor(
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly repo: IUsuarioEmpresaRepository,
  ) {}

  async execute(id: number, dto: UpdateUsuarioEmpresaDto) {
    let payload: Partial<UpdateUsuarioEmpresaDto> = { ...dto };
    if (dto.password) {
      const hash = await bcrypt.hash(dto.password, 10);
      payload = { ...payload, password: hash };
    }
    const updated = await this.repo.update(id, payload);
    const { password, ...safe } = updated as any;
    return safe;
  }
}

export default UpdateUsuarioEmpresaUseCase;
