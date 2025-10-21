import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  IUsuarioEmpresaRepository,
  USUARIO_EMPRESA_REPOSITORY,
} from '../usuarios-empresa/application/interfaces/usuario-empresa.repository.interface';
import {
  IUsuarioFreelerRepository,
  USUARIO_FREELER_REPOSITORY,
} from '../usuarios-freeler/application/interfaces/usuario-freeler.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly empresaRepo: IUsuarioEmpresaRepository,
    @Inject(USUARIO_FREELER_REPOSITORY)
    private readonly freelerRepo: IUsuarioFreelerRepository,
  ) {}

  async loginEmpresa(email: string, password: string) {
    const user = await this.empresaRepo.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    const payload = {
      sub: user.id_usuario_empresa,
      type: 'empresa' as const,
      email: user.email,
      role: (user.rol?.nombre as string | undefined) ?? 'admin',
    };
    return { access_token: await this.jwt.signAsync(payload) };
  }

  async loginFreeler(email: string, password: string) {
    const user = await this.freelerRepo.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    const payload = {
      sub: user.id_usuario_freeler,
      type: 'freeler' as const,
      email: user.email,
    };
    return { access_token: await this.jwt.signAsync(payload) };
  }
}

export default AuthService;
