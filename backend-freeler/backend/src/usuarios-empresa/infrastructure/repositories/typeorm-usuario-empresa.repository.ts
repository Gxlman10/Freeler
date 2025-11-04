import { ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';
import { IUsuarioEmpresaRepository } from '../../application/interfaces/usuario-empresa.repository.interface';
import { UsuarioEmpresaEntity } from '../entities/usuario-empresa.entity';

export class TypeormUsuarioEmpresaRepository
  implements IUsuarioEmpresaRepository
{
  constructor(
    @InjectRepository(UsuarioEmpresaEntity)
    private readonly repo: Repository<UsuarioEmpresaEntity>,
  ) {}

  async create(
    data: Partial<UsuarioEmpresaEntity>,
  ): Promise<UsuarioEmpresaEntity> {
    if (data.email) {
      const exists = await this.findByEmail(data.email);
      if (exists) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }
    const entity = this.repo.create({ estado: 1, ...data });
    return this.repo.save(entity);
  }

  findById(id: number) {
    const where: FindOptionsWhere<UsuarioEmpresaEntity> = {
      id_usuario_empresa: id,
    };
    return this.repo.findOne({
      where,
      relations: { empresa: true, rol: true },
    });
  }

  findByEmail(email: string) {
    return this.repo.findOne({
      where: { email },
      relations: { empresa: true, rol: true },
    });
  }

  async update(
    id: number,
    data: Partial<UsuarioEmpresaEntity>,
  ): Promise<UsuarioEmpresaEntity> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException('NOT_FOUND');

    if (data.email && data.email !== current.email) {
      const exists = await this.findByEmail(data.email);
      if (exists) throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    const where: FindOptionsWhere<UsuarioEmpresaEntity> = {
      id_usuario_empresa: id,
    };
    await this.repo.update(where, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('NOT_FOUND');
    return updated;
  }

  async paginate({ page = 1, limit = 10, search, id_empresa }: PaginationDto) {
    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.empresa', 'empresa')
      .leftJoinAndSelect('u.rol', 'rol');

    qb.where('1=1');

    if (id_empresa) {
      qb.andWhere('u.id_empresa = :empresaId', { empresaId: id_empresa });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(u.nombres) LIKE LOWER(:q) OR LOWER(u.apellidos) LIKE LOWER(:q) OR LOWER(u.email) LIKE LOWER(:q))',
        { q: `%${search}%` },
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
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('NOT_FOUND');
    const where: FindOptionsWhere<UsuarioEmpresaEntity> = {
      id_usuario_empresa: id,
    };
    await this.repo.update(where, { estado: 0 });
  }
}

export default TypeormUsuarioEmpresaRepository;
