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
    return this.repo.save(entity);
  }

  findById(id: number) {
    const where: FindOptionsWhere<LeadEntity> = { id_lead: id };
    return this.repo.findOne({ where });
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
    } = filters;
    const qb = this.repo.createQueryBuilder('l');

    if (search) {
      qb.where(
        'LOWER(l.nombres) LIKE LOWER(:q) OR LOWER(l.apellidos) LIKE LOWER(:q) OR LOWER(l.email) LIKE LOWER(:q) OR l.dni LIKE :qraw',
        { q: `%${search}%`, qraw: `%${search}%` },
      );
    }

    if (id_campania)
      qb.andWhere('l.id_campania = :id_campania', { id_campania });
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
        'a.id_lead = l.id_lead AND a.estado = :aestado AND a.id_usuario_empresa = :ae',
        { aestado: 'activo', ae: asignado_a_usuario_empresa_id },
      );

    const [data, total] = await qb
      .orderBy('l.fecha_creacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total };
  }
}

export default TypeormLeadRepository;
