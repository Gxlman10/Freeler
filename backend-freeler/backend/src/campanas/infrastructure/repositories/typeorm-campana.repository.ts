import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { FindCampanasDto } from '../../infrastructure/dto/find-campanas.dto';
import { ICampanaRepository } from '../../application/interfaces/campana.repository.interface';
import { CampanaEntity } from '../entities/campana.entity';
import { NotFoundException } from '@nestjs/common';

export class TypeormCampanaRepository implements ICampanaRepository {
  constructor(
    @InjectRepository(CampanaEntity)
    private readonly repo: Repository<CampanaEntity>,
  ) {}

  create(data: Partial<CampanaEntity>) {
    const entity = this.repo.create({ estado: 1, ...data });
    return this.repo.save(entity);
  }

  findById(id: number) {
    const where: FindOptionsWhere<CampanaEntity> = { id_campania: id };
    return this.repo.findOne({ where });
  }

  async update(
    id: number,
    data: Partial<CampanaEntity>,
  ): Promise<CampanaEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('NOT_FOUND');
    const where: FindOptionsWhere<CampanaEntity> = { id_campania: id };
    await this.repo.update(where, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('NOT_FOUND');
    return updated;
  }

  async paginate(filters: FindCampanasDto) {
    const {
      page = 1,
      limit = 10,
      search,
      id_empresa,
      estado,
      fecha_fin_hasta,
      fecha_inicio_desde,
    } = filters;
    const qb = this.repo.createQueryBuilder('c');

    if (search) {
      qb.where(
        'LOWER(c.nombre) LIKE LOWER(:q) OR LOWER(c.descripcion) LIKE LOWER(:q) OR LOWER(c.ubicacion) LIKE LOWER(:q)',
        { q: `%${search}%` },
      );
    }

    if (id_empresa) {
      qb.andWhere('c.id_empresa = :empresa', { empresa: id_empresa });
    }

    if (typeof estado === 'number') {
      qb.andWhere('c.estado = :estado', { estado });
    }

    if (fecha_inicio_desde) {
      qb.andWhere('c.fecha_inicio >= :fechaInicio', {
        fechaInicio: fecha_inicio_desde,
      });
    }

    if (fecha_fin_hasta) {
      qb.andWhere('c.fecha_fin <= :fechaFin', { fechaFin: fecha_fin_hasta });
    }

    const [data, total] = await qb
      .orderBy('c.fecha_creacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async softDelete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('NOT_FOUND');
    const where: FindOptionsWhere<CampanaEntity> = { id_campania: id };
    await this.repo.update(where, { estado: 0 });
  }
}

export default TypeormCampanaRepository;
