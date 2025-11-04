import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
    const current = await this.repo.findById(id);
    const normalizeDate = (value?: string | Date | null) => {
      if (!value) return undefined;
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
      }
      return value;
    };
    const fechaInicio = data.fecha_inicio ?? normalizeDate(current?.fecha_inicio);
    const fechaFin = data.fecha_fin ?? normalizeDate(current?.fecha_fin);
    this.ensureValidDates(fechaInicio, fechaFin);
    const updated = await this.repo.update(id, data);
    return updated;
  }

  private ensureValidDates(fechaInicio?: string, fechaFin?: string) {
    if (!fechaInicio && fechaFin) {
      throw new BadRequestException('FECHA_INICIO_REQUERIDA');
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

export default UpdateCampanaUseCase;
