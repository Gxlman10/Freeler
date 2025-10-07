import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioFreelerDto } from '../../infrastructure/dto/create-usuario-freeler.dto';
import {
  IUsuarioFreelerRepository,
  USUARIO_FREELER_REPOSITORY,
} from '../interfaces/usuario-freeler.repository.interface';

@Injectable()
export class RegisterUsuarioFreelerUseCase {
  constructor(
    @Inject(USUARIO_FREELER_REPOSITORY)
    private readonly repo: IUsuarioFreelerRepository,
  ) {}

  async execute(dto: CreateUsuarioFreelerDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const created = await this.repo.create({
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dni: dto.dni,
      email: dto.email,
      telefono: dto.telefono,
      password: hashed,
      estado: 1,
      saldo: '0.00',
    });
    const { password: _password, ...safe } = created;
    void _password;
    return safe;
  }
}
export default RegisterUsuarioFreelerUseCase;
