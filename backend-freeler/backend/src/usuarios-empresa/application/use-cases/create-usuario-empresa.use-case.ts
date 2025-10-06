import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioEmpresaDto } from '../../infrastructure/dto/create-usuario-empresa.dto';
import { IUsuarioEmpresaRepository, USUARIO_EMPRESA_REPOSITORY } from '../interfaces/usuario-empresa.repository.interface';

@Injectable()
export class CreateUsuarioEmpresaUseCase {
  constructor(
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly repo: IUsuarioEmpresaRepository,
  ) {}

  async execute(dto: CreateUsuarioEmpresaDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const created = await this.repo.create({
      id_empresa: dto.id_empresa,
      id_rol: dto.id_rol,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      email: dto.email,
      password: hash,
      estado: dto.estado ?? 1,
    });
    const { password, ...safe } = created as any;
    return safe;
  }
}

export default CreateUsuarioEmpresaUseCase;
