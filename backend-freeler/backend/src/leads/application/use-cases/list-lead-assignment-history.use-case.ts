import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsignacionEntity } from '../../infrastructure/entities/asignacion.entity';

type ActorSummary = {
  id_usuario_empresa: number;
  nombres?: string | null;
  apellidos?: string | null;
  email?: string | null;
};

type HistoryEntry = {
  id_asignacion: number;
  id_lead: number;
  fecha_asignacion: Date;
  estado_asignacion: number;
  estado?: {
    id_estado_lead: number;
    nombre: string | null;
  } | null;
  actor?: ActorSummary | null;
  asignado?: ActorSummary | null;
};

@Injectable()
export class ListLeadAssignmentHistoryUseCase {
  constructor(
    @InjectRepository(AsignacionEntity)
    private readonly repo: Repository<AsignacionEntity>,
  ) {}

  async execute(leadId: number) {
    const qb = this.repo
      .createQueryBuilder('assign')
      .leftJoinAndSelect('assign.actor', 'actor')
      .leftJoinAndSelect('assign.asignado', 'asignado')
      .leftJoin('freeler.estado_lead', 'estado', 'estado.id_estado_lead = assign.id_estado_lead')
      .addSelect('estado.nombre', 'estado_nombre')
      .where('assign.id_lead = :leadId', { leadId })
      .orderBy('assign.fecha_asignacion', 'ASC');

    const { raw, entities } = await qb.getRawAndEntities();

    const entries: HistoryEntry[] = entities.map((entity, index) => ({
      id_asignacion: entity.id_asignacion,
      id_lead: entity.id_lead,
      fecha_asignacion: entity.fecha_asignacion,
      estado_asignacion: entity.estado,
      estado: entity.id_estado_lead
        ? {
            id_estado_lead: entity.id_estado_lead,
            nombre: raw[index]?.estado_nombre ?? null,
          }
        : null,
      actor: entity.actor
        ? {
            id_usuario_empresa: entity.actor.id_usuario_empresa,
            nombres: entity.actor.nombres,
            apellidos: entity.actor.apellidos,
            email: entity.actor.email,
          }
        : null,
      asignado: entity.asignado
        ? {
            id_usuario_empresa: entity.asignado.id_usuario_empresa,
            nombres: entity.asignado.nombres,
            apellidos: entity.asignado.apellidos,
            email: entity.asignado.email,
          }
        : null,
    }));

    return {
      leadId,
      entries,
    };
  }
}

export default ListLeadAssignmentHistoryUseCase;

