import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import LeadsPermissionService from '../services/leads-permission.service';
import { AsignacionEntity } from '../../infrastructure/entities/asignacion.entity';
import { UpdateAsignacionDto } from '../../infrastructure/dto/update-asignacion.dto';

@Injectable()
export class UpdateAsignacionUseCase {
  constructor(
    private readonly permission: LeadsPermissionService,
    @InjectRepository(AsignacionEntity)
    private readonly repo: Repository<AsignacionEntity>,
  ) {}

  async execute(id_asignacion: number, dto: UpdateAsignacionDto) {
    await this.permission.ensureEmpresaActor(dto.usuarioEmpresaId);
    const asign = await this.repo.findOne({ where: { id_asignacion } });
    if (!asign) throw new NotFoundException('ASIGNACION_NOT_FOUND');
    const estadoNumerico = dto.estado === 'activo' ? 1 : 0;
    // Mantener el historial marcando la asignación con el estado numérico equivalente
    asign.estado = estadoNumerico;
    await this.repo.save(asign);
    return { ok: true };
  }
}

export default UpdateAsignacionUseCase;
