import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
    this.ensureValidDates(data.fecha_inicio, data.fecha_fin);
    return this.repo.create(data);
  }

  private ensureValidDates(fechaInicio?: string, fechaFin?: string) {
    if (!fechaInicio && fechaFin) {
      throw new BadRequestException(
        'FECHA_INICIO_REQUERIDA',
      );
    }
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
        throw new BadRequestException('FECHAS_INVALIDAS');
      }
      if (fin < inicio) {
        throw new BadRequestException('FECHA_FIN_INVALIDA');
      }
    }
  }
}

export default CreateCampanaUseCase;
