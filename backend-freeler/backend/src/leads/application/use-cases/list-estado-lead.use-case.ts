import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoLeadEntity } from '../../infrastructure/entities/estado-lead.entity';

@Injectable()
export class ListEstadoLeadUseCase {
  constructor(
    @InjectRepository(EstadoLeadEntity)
    private readonly repo: Repository<EstadoLeadEntity>,
  ) {}

  execute() {
    return this.repo.find({ order: { id_estado_lead: 'ASC' } });
  }
}

export default ListEstadoLeadUseCase;
