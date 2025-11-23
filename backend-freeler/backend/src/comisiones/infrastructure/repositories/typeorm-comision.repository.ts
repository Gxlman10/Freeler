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

  findManyByFreeler(freelerId: number) {
    return this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.campania', 'campania')
      .leftJoinAndSelect('c.estado', 'estado')
      .where('c.id_usuario_freeler = :freelerId', { freelerId })
      .orderBy('c.id_comision', 'DESC')
      .getMany();
  }

  findPendingByFreeler(freelerId: number, ids?: number[]) {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.id_usuario_freeler = :freelerId', { freelerId })
      .andWhere('COALESCE(c.id_estado_comision, 1) IN (:...states)', { states: [1, 2] });
    if (ids?.length) {
      qb.andWhere('c.id_comision IN (:...ids)', { ids });
    }
    return qb.getMany();
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
      id_empresa,
    } = filters;
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.campania', 'campania')
      .leftJoinAndSelect('c.freeler', 'freeler')
      .leftJoinAndSelect('c.estado', 'estado');
    if (id_empresa) {
      qb.leftJoin('c.campania', 'campania');
    }
    if (id_estado_comision)
      qb.where('c.id_estado_comision = :s', { s: id_estado_comision });
    if (id_campania)
      qb.andWhere('c.id_campania = :camp', { camp: id_campania });
    if (id_usuario_freeler)
      qb.andWhere('c.id_usuario_freeler = :fre', { fre: id_usuario_freeler });
    if (id_empresa)
      qb.andWhere('campania.id_empresa = :empresaId', { empresaId: id_empresa });
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
