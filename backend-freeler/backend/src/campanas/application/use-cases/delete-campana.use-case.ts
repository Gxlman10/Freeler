import { Inject, Injectable } from '@nestjs/common';
import {
  CAMPANA_REPOSITORY,
  ICampanaRepository,
} from '../interfaces/campana.repository.interface';
import { CampanaPermissionService } from '../services/campana-permission.service';

@Injectable()
export class DeleteCampanaUseCase {
  constructor(
    @Inject(CAMPANA_REPOSITORY)
    private readonly repo: ICampanaRepository,
    private readonly permissionService: CampanaPermissionService,
  ) {}

  async execute(id: number, usuarioEmpresaId: number) {
    await this.permissionService.ensureActorHasPermission(usuarioEmpresaId);
    await this.repo.softDelete(id);
    return { ok: true };
  }
}

export default DeleteCampanaUseCase;
