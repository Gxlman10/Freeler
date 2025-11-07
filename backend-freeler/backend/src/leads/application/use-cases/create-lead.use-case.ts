import { Inject, Injectable } from '@nestjs/common';
import {
  LEAD_REPOSITORY,
  ILeadRepository,
} from '../interfaces/lead.repository.interface';
import { CreateLeadDto } from '../../infrastructure/dto/create-lead.dto';

@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly repo: ILeadRepository,
  ) {}

  execute(dto: CreateLeadDto) {
    return this.repo.create({
      id_usuario_freeler: dto.usuarioFreelerId ?? null,
      id_campania: dto.id_campania,
      origen: dto.origen,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dni: dto.dni,
      email: dto.email,
      telefono: dto.telefono,
      ocupacion: dto.ocupacion,
      ciudad: dto.ciudad,
      descripcion: dto.descripcion,
      estado_completo: dto.estado_completo ?? true,
      id_estado_lead: 1,
    });
  }
}

export default CreateLeadUseCase;
