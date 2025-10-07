import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IUsuarioFreelerRepository } from '../../application/interfaces/usuario-freeler.repository.interface';
import { UsuarioFreelerEntity } from '../entities/usuario-freeler.entity';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

export class TypeormUsuarioFreelerRepository
  implements IUsuarioFreelerRepository
{
  constructor(
    @InjectRepository(UsuarioFreelerEntity)
    private readonly repo: Repository<UsuarioFreelerEntity>,
  ) {}

  async create(
    data: Partial<UsuarioFreelerEntity>,
  ): Promise<UsuarioFreelerEntity> {
    if (data.email) {
      const exists = await this.findByEmail(data.email);
      if (exists) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }
    if (data.dni) {
      const exists = await this.findByDni(data.dni);
      if (exists) throw new ConflictException('DNI_ALREADY_EXISTS');
    }
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  findById(id: number) {
    const where: FindOptionsWhere<UsuarioFreelerEntity> = {
      id_usuario_freeler: id,
    };
    return this.repo.findOne({ where });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findByDni(dni: string) {
    return this.repo.findOne({ where: { dni } });
  }

  async update(
    id: number,
    data: Partial<UsuarioFreelerEntity>,
  ): Promise<UsuarioFreelerEntity> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException('NOT_FOUND');

    if (data.email && data.email !== current.email) {
      const exists = await this.findByEmail(data.email);
      if (exists) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }
    if (data.dni && data.dni !== current.dni) {
      const exists = await this.findByDni(data.dni);
      if (exists) throw new ConflictException('DNI_ALREADY_EXISTS');
    }

    const where: FindOptionsWhere<UsuarioFreelerEntity> = {
      id_usuario_freeler: id,
    };
    await this.repo.update(where, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('NOT_FOUND');
    return updated;
  }

  async paginate({ page = 1, limit = 10, search }: PaginationDto) {
    const qb = this.repo.createQueryBuilder('u');
    if (search) {
      qb.where(
        'LOWER(u.nombres) LIKE LOWER(:q) OR LOWER(u.apellidos) LIKE LOWER(:q) OR LOWER(u.email) LIKE LOWER(:q) OR u.dni LIKE :qraw',
        { q: `%${search}%`, qraw: `%${search}%` },
      );
    }
    const [data, total] = await qb
      .orderBy('u.fecha_creacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total };
  }

  async softDelete(id: number): Promise<void> {
    const where: FindOptionsWhere<UsuarioFreelerEntity> = {
      id_usuario_freeler: id,
    };
    await this.repo.update(where, { estado: 0 });
  }
}

export default TypeormUsuarioFreelerRepository;
