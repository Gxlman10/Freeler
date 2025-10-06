import { ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';
import { IEmpresaRepository } from '../../application/interfaces/empresa.repository.interface';
import { EmpresaEntity } from '../entities/empresa.entity';

export class TypeormEmpresaRepository implements IEmpresaRepository {
  constructor(
    @InjectRepository(EmpresaEntity)
    private readonly repo: Repository<EmpresaEntity>,
  ) {}

  async create(data: Partial<EmpresaEntity>): Promise<EmpresaEntity> {
    if (data.ruc) {
      const exists = await this.findByRuc(data.ruc);
      if (exists) throw new ConflictException('RUC_ALREADY_EXISTS');
    }
    if (data.email) {
      const exists = await this.findByEmail(data.email);
      if (exists) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }
    const entity = this.repo.create({ estado: 1, ...data });
    return this.repo.save(entity);
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id_empresa: id } as any });
  }

  findByRuc(ruc: string) {
    return this.repo.findOne({ where: { ruc } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async update(id: number, data: Partial<EmpresaEntity>): Promise<EmpresaEntity> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException('NOT_FOUND');

    if (data.ruc && data.ruc !== current.ruc) {
      const exists = await this.findByRuc(data.ruc);
      if (exists) throw new ConflictException('RUC_ALREADY_EXISTS');
    }
    if (data.email && data.email !== current.email) {
      const exists = await this.findByEmail(data.email);
      if (exists) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    await this.repo.update({ id_empresa: id } as any, data);
    return (await this.findById(id))!;
  }

  async paginate({ page = 1, limit = 10, search }: PaginationDto) {
    const qb = this.repo.createQueryBuilder('e');
    if (search) {
      qb.where(
        'LOWER(e.razon_social) LIKE LOWER(:q) OR e.ruc LIKE :qraw OR LOWER(e.email) LIKE LOWER(:q) OR LOWER(e.representante_legal) LIKE LOWER(:q)',
        { q: `%${search}%`, qraw: `%${search}%` },
      );
    }
    const [data, total] = await qb
      .orderBy('e.fecha_creacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async softDelete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('NOT_FOUND');
    await this.repo.update({ id_empresa: id } as any, { estado: 0 });
  }
}

export default TypeormEmpresaRepository;
