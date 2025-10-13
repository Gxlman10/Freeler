import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import LeadsPermissionService from '../services/leads-permission.service';
import { AsignacionEntity } from '../../infrastructure/entities/asignacion.entity';
import { BulkUpdateAsignacionesDto } from '../../infrastructure/dto/bulk-update-asignaciones.dto';
import { LeadEntity } from '../../infrastructure/entities/lead.entity';

@Injectable()
export class BulkUpdateAsignacionesUseCase {
  constructor(
    private readonly permission: LeadsPermissionService,
    @InjectRepository(AsignacionEntity)
    private readonly asignRepo: Repository<AsignacionEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepo: Repository<LeadEntity>,
  ) {}

  async execute(dto: BulkUpdateAsignacionesDto) {
    await this.permission.ensureEmpresaActor(dto.actorUsuarioEmpresaId);

    // Construir query para obtener IDs de asignación a actualizar
    const qb = this.asignRepo.createQueryBuilder('a');

    if (dto.id_campania) {
      qb.innerJoin(LeadEntity, 'l', 'l.id_lead = a.id_lead').andWhere(
        'l.id_campania = :camp',
        { camp: dto.id_campania },
      );
    }

    if (dto.leadIds && dto.leadIds.length > 0) {
      qb.andWhere('a.id_lead IN (:...leads)', { leads: dto.leadIds });
    }

    if (dto.usuarioEmpresaIdAsignado) {
      qb.andWhere('a.id_usuario_empresa = :ue', {
        ue: dto.usuarioEmpresaIdAsignado,
      });
    }

    if (dto.soloInactivas) {
      qb.andWhere('a.estado = :est', { est: 'inactivo' });
    }

    if (dto.fecha_desde) {
      qb.andWhere('a.fecha_asignacion >= :fd', { fd: dto.fecha_desde });
    }

    if (dto.fecha_hasta) {
      qb.andWhere('a.fecha_asignacion <= :fh', { fh: dto.fecha_hasta });
    }

    qb.select('a.id_asignacion', 'id');
    if (dto.maxRows) qb.limit(dto.maxRows);

    const rows = await qb.getRawMany<{ id: number }>();
    const ids = rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n));

    if (dto.simulate) {
      return { simulate: true as const, affected: ids.length };
    }

    if (ids.length === 0) return { simulate: false as const, affected: 0 };

    const result = await this.asignRepo
      .createQueryBuilder()
      .update(AsignacionEntity)
      .set({ estado: dto.estadoObjetivo })
      .where({ id_asignacion: In(ids) })
      .execute();

    return {
      simulate: false as const,
      affected: result.affected ?? ids.length,
    };
  }
}

export default BulkUpdateAsignacionesUseCase;
