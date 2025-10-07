import { Inject, Injectable } from '@nestjs/common';
import {
  CAMPANA_REPOSITORY,
  ICampanaRepository,
} from '../interfaces/campana.repository.interface';
import { CreateCampanaDto } from '../../infrastructure/dto/create-campana.dto';
import { CampanaPermissionService } from '../services/campana-permission.service';

@Injectable()
export class CreateCampanaUseCase {
  constructor(
    @Inject(CAMPANA_REPOSITORY)
    private readonly repo: ICampanaRepository,
    private readonly permissionService: CampanaPermissionService,
  ) {}

  async execute(dto: CreateCampanaDto) {
    const { usuarioEmpresaId, ...data } = dto;
    await this.permissionService.ensureActorHasPermission(usuarioEmpresaId);
    return this.repo.create(data);
  }
}

export default CreateCampanaUseCase;
