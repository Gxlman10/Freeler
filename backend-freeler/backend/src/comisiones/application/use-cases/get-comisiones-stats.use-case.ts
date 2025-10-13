import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComisionEntity } from '../../infrastructure/entities/comision.entity';

@Injectable()
export class GetComisionesStatsUseCase {
  constructor(
    @InjectRepository(ComisionEntity)
    private readonly repo: Repository<ComisionEntity>,
  ) {}

  async execute() {
    const qb = this.repo
      .createQueryBuilder('c')
      .select('c.id_estado_comision', 'estado')
      .addSelect('COUNT(*)', 'total');
    const rows = await qb.groupBy('c.id_estado_comision').getRawMany();
    const map: Record<string, number> = {};
    for (const r of rows) {
      const key = String((r as { estado: number | null }).estado ?? 'null');
      const value = Number((r as { total: string }).total ?? 0);
      map[key] = value;
    }
    return { byEstado: map };
  }
}

export default GetComisionesStatsUseCase;
