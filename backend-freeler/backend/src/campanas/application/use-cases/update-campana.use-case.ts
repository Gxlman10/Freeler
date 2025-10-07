import { Inject, Injectable } from '@nestjs/common';
import {
  CAMPANA_REPOSITORY,
  ICampanaRepository,
} from '../interfaces/campana.repository.interface';
import { UpdateCampanaDto } from '../../infrastructure/dto/update-campana.dto';
import { CampanaPermissionService } from '../services/campana-permission.service';

@Injectable()
export class UpdateCampanaUseCase {
  constructor(
    @Inject(CAMPANA_REPOSITORY)
    private readonly repo: ICampanaRepository,
    private readonly permissionService: CampanaPermissionService,
  ) {}

  async execute(id: number, dto: UpdateCampanaDto) {
    const { usuarioEmpresaId, ...data } = dto;
    await this.permissionService.ensureActorHasPermission(usuarioEmpresaId);
    const updated = await this.repo.update(id, data);
    return updated;
  }
}

export default UpdateCampanaUseCase;
