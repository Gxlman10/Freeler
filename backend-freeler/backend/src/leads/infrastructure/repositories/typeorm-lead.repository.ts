import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ILeadRepository } from '../../application/interfaces/lead.repository.interface';
import { LeadEntity } from '../entities/lead.entity';
import { FindLeadsDto } from '../dto/find-leads.dto';
import { NotFoundException } from '@nestjs/common';

export class TypeormLeadRepository implements ILeadRepository {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly repo: Repository<LeadEntity>,
  ) {}

  async create(data: Partial<LeadEntity>): Promise<LeadEntity> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    const withRelations = await this.findById(saved.id_lead);
    if (!withRelations) throw new NotFoundException('NOT_FOUND');
    return withRelations;
  }

  findById(id: number) {
    return this.repo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.campania', 'campania')
      .leftJoinAndSelect('l.estado', 'estado')
      .leftJoinAndSelect('l.asignaciones', 'asignaciones', 'asignaciones.estado = 1')
      .leftJoinAndSelect('asignaciones.asignado', 'asignado')
      .where('l.id_lead = :id', { id })
      .getOne();
  }

  async update(id: number, data: Partial<LeadEntity>): Promise<LeadEntity> {
    const where: FindOptionsWhere<LeadEntity> = { id_lead: id };
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('NOT_FOUND');
    await this.repo.update(where, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('NOT_FOUND');
    return updated;
  }

  async refreshCreatedAt(id: number) {
    const result = await this.repo
      .createQueryBuilder()
      .update(LeadEntity)
      .set({ fecha_creacion: () => 'CURRENT_TIMESTAMP' })
      .where('id_lead = :id', { id })
      .returning('*')
      .execute();

    const [row] = result.raw as LeadEntity[];
    if (!row) throw new NotFoundException('NOT_FOUND');
    const updated = await this.findById(row.id_lead);
    if (!updated) throw new NotFoundException('NOT_FOUND');
    return updated;
  }

  async paginate(filters: FindLeadsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      id_campania,
      id_usuario_freeler,
      id_estado_lead,
      estado_completo,
      fecha_desde,
      fecha_hasta,
      asignado_a_usuario_empresa_id,
      id_empresa,
      id_campanias,
    } = filters;
    const qb = this.repo.createQueryBuilder('l');

    qb.leftJoinAndSelect('l.campania', 'campania');
    qb.leftJoinAndSelect('l.estado', 'estado');
    qb.leftJoinAndSelect('l.asignaciones', 'asignaciones', 'asignaciones.estado = 1');
    qb.leftJoinAndSelect('asignaciones.asignado', 'asignado');

    if (search) {
      qb.where(
        'LOWER(l.nombres) LIKE LOWER(:q) OR LOWER(l.apellidos) LIKE LOWER(:q) OR LOWER(l.email) LIKE LOWER(:q) OR l.dni LIKE :qraw',
        { q: `%${search}%`, qraw: `%${search}%` },
      );
    }

    if (id_campania)
      qb.andWhere('l.id_campania = :id_campania', { id_campania });
    if (id_campanias?.length)
      qb.andWhere('l.id_campania IN (:...id_campanias)', {
        id_campanias,
      });
    if (id_usuario_freeler)
      qb.andWhere('l.id_usuario_freeler = :id_usuario_freeler', {
        id_usuario_freeler,
      });
    if (id_estado_lead)
      qb.andWhere('l.id_estado_lead = :id_estado_lead', { id_estado_lead });
    if (typeof estado_completo === 'boolean')
      qb.andWhere('l.estado_completo = :estado_completo', { estado_completo });
    if (fecha_desde)
      qb.andWhere('l.fecha_creacion >= :fd', { fd: fecha_desde });
    if (fecha_hasta)
      qb.andWhere('l.fecha_creacion <= :fh', { fh: fecha_hasta });
    if (asignado_a_usuario_empresa_id)
      qb.innerJoin(
        'freeler.asignaciones',
        'a',
        'a.id_lead = l.id_lead AND a.estado = :aestado AND a.id_asignado_usuario_empresa = :ae',
        { aestado: 1, ae: asignado_a_usuario_empresa_id },
      );
    if (id_empresa)
      qb.andWhere('campania.id_empresa = :id_empresa', { id_empresa });

    const [data, total] = await qb
      .orderBy('l.fecha_creacion', 'DESC')
      .addOrderBy('asignaciones.fecha_asignacion', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async paginateAssignedTo(tenantId: number, filters: FindLeadsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      id_campania,
      id_campanias,
      id_estado_lead,
      estado_completo,
      fecha_desde,
      fecha_hasta,
      id_empresa,
    } = filters;

    const qb = this.repo.createQueryBuilder('l');
    qb.leftJoinAndSelect('l.campania', 'campania');
    qb.leftJoinAndSelect('l.estado', 'estado');
    qb.innerJoin(
      'freeler.asignaciones',
      'assign',
      'assign.id_lead = l.id_lead AND assign.estado = 1 AND assign.id_asignado_usuario_empresa = :tenantId',
      { tenantId },
    );
    qb.leftJoinAndSelect('assign.asignado', 'asignado');

    if (search) {
      qb.where(
        'LOWER(l.nombres) LIKE LOWER(:q) OR LOWER(l.apellidos) LIKE LOWER(:q) OR LOWER(l.email) LIKE LOWER(:q) OR l.dni LIKE :qraw',
        { q: `%${search}%`, qraw: `%${search}%` },
      );
    }

    if (id_campania) {
      qb.andWhere('l.id_campania = :id_campania', { id_campania });
    }
    if (id_campanias?.length) {
      qb.andWhere('l.id_campania IN (:...id_campanias)', { id_campanias });
    }
    if (id_estado_lead) {
      qb.andWhere('l.id_estado_lead = :id_estado_lead', { id_estado_lead });
    }
    if (typeof estado_completo === 'boolean') {
      qb.andWhere('l.estado_completo = :estado_completo', { estado_completo });
    }
    if (fecha_desde) {
      qb.andWhere('l.fecha_creacion >= :fd', { fd: fecha_desde });
    }
    if (fecha_hasta) {
      qb.andWhere('l.fecha_creacion <= :fh', { fh: fecha_hasta });
    }
    if (id_empresa) {
      qb.andWhere('campania.id_empresa = :id_empresa', { id_empresa });
    }

    const [data, total] = await qb
      .orderBy('l.fecha_creacion', 'DESC')
      .addOrderBy('assign.fecha_asignacion', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

}

export default TypeormLeadRepository;
