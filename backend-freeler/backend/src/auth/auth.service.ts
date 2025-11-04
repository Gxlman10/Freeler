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
    if (!user || user.estado === 0) return null;

    const passwordHash = user.password ?? '';
    const isHash = passwordHash.startsWith('$2');

    let ok = false;
    if (isHash) {
      ok = await bcrypt.compare(password, passwordHash);
    } else {
      ok = passwordHash === password;
    }

    if (!ok) return null;

    // Si el password estaba en texto plano lo rehashamos para futuras sesiones
    if (!isHash) {
      const hashed = await bcrypt.hash(password, 10);
      await this.empresaRepo.update(user.id_usuario_empresa, {
        password: hashed,
      });
    }

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
    if (!user || user.estado === 0) return null;

    const passwordHash = user.password ?? '';
    const isHash = passwordHash.startsWith('$2');

    let ok = false;
    if (isHash) {
      ok = await bcrypt.compare(password, passwordHash);
    } else {
      ok = passwordHash === password;
    }

    if (!ok) return null;

    // Rehash en caliente si el password qued� plano en la BD hist�rica
    if (!isHash) {
      const hashed = await bcrypt.hash(password, 10);
      await this.freelerRepo.update(user.id_usuario_freeler, {
        password: hashed,
      });
    }

    const payload = {
      sub: user.id_usuario_freeler,
      type: 'freeler' as const,
      email: user.email,
    };
    return { access_token: await this.jwt.signAsync(payload) };
  }
}

export default AuthService;
