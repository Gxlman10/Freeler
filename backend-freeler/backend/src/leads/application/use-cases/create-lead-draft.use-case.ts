import { Inject, Injectable } from '@nestjs/common';
import {
  LEAD_REPOSITORY,
  ILeadRepository,
} from '../interfaces/lead.repository.interface';
import { CreateLeadDraftDto } from '../../infrastructure/dto/create-lead-draft.dto';

@Injectable()
export class CreateLeadDraftUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly repo: ILeadRepository,
  ) {}

  execute(dto: CreateLeadDraftDto) {
    return this.repo.create({
      id_usuario_freeler: dto.usuarioFreelerId,
      id_campania: dto.id_campania ?? null,
      origen: dto.origen || 'Borrador',
      nombres: dto.nombres ?? '',
      apellidos: dto.apellidos ?? '',
      dni: dto.dni,
      email: dto.email,
      telefono: dto.telefono,
      ocupacion: dto.ocupacion,
      ciudad: dto.ciudad,
      descripcion: dto.descripcion,
      estado_completo: false,
      id_estado_lead: null,
    });
  }
}

export default CreateLeadDraftUseCase;
