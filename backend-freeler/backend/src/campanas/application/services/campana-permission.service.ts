import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IUsuarioEmpresaRepository,
  USUARIO_EMPRESA_REPOSITORY,
} from '../../../usuarios-empresa/application/interfaces/usuario-empresa.repository.interface';

@Injectable()
export class CampanaPermissionService {
  private readonly allowedRoles = new Set(['admin', 'supervisor']);

  constructor(
    @Inject(USUARIO_EMPRESA_REPOSITORY)
    private readonly usuariosEmpresa: IUsuarioEmpresaRepository,
  ) {}

  async ensureActorHasPermission(actorId: number) {
    const actor = await this.usuariosEmpresa.findById(actorId);
    if (!actor) throw new NotFoundException('USUARIO_EMPRESA_NOT_FOUND');
    if (actor.estado === 0)
      throw new ForbiddenException('USUARIO_EMPRESA_INACTIVO');
    const roleName = actor.rol?.nombre?.toLowerCase();
    if (!roleName || !this.allowedRoles.has(roleName)) {
      throw new ForbiddenException('ROL_NO_AUTORIZADO');
    }
  }
}

export default CampanaPermissionService;
