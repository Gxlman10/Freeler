import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IComisionRepository } from '../../application/interfaces/comision.repository.interface';
import { ComisionEntity } from '../entities/comision.entity';
import { NotFoundException } from '@nestjs/common';

export class TypeormComisionRepository implements IComisionRepository {
  constructor(
    @InjectRepository(ComisionEntity)
    private readonly repo: Repository<ComisionEntity>,
  ) {}

  async create(data: Partial<ComisionEntity>): Promise<ComisionEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  findById(id: number) {
    const where: FindOptionsWhere<ComisionEntity> = { id_comision: id };
    return this.repo.findOne({ where });
  }

  findByLeadId(leadId: number) {
    const where: FindOptionsWhere<ComisionEntity> = { id_lead: leadId };
    return this.repo.findOne({ where });
  }

  async update(id: number, data: Partial<ComisionEntity>) {
    const where: FindOptionsWhere<ComisionEntity> = { id_comision: id };
    const exists = await this.findById(id);
    if (!exists) throw new NotFoundException('NOT_FOUND');
    await this.repo.update(where, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('NOT_FOUND');
    return updated;
  }

  async paginate(filters: import('../dto/find-comisiones.dto').default) {
    const {
      page = 1,
      limit = 10,
      id_estado_comision,
      id_campania,
      id_usuario_freeler,
      fecha_desde,
      fecha_hasta,
    } = filters;
    const qb = this.repo.createQueryBuilder('c');
    if (id_estado_comision)
      qb.where('c.id_estado_comision = :s', { s: id_estado_comision });
    if (id_campania)
      qb.andWhere('c.id_campania = :camp', { camp: id_campania });
    if (id_usuario_freeler)
      qb.andWhere('c.id_usuario_freeler = :fre', { fre: id_usuario_freeler });
    if (fecha_desde) qb.andWhere('c.fecha_pago >= :fd', { fd: fecha_desde });
    if (fecha_hasta) qb.andWhere('c.fecha_pago <= :fh', { fh: fecha_hasta });

    const [data, total] = await qb
      .orderBy('c.id_comision', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total };
  }
}

export default TypeormComisionRepository;
