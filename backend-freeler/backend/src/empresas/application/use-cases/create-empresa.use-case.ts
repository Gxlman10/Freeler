import { Inject, Injectable } from '@nestjs/common';
import { CreateEmpresaDto } from '../../infrastructure/dto/create-empresa.dto';
import { EMPRESA_REPOSITORY, IEmpresaRepository } from '../interfaces/empresa.repository.interface';

@Injectable()
export class CreateEmpresaUseCase {
  constructor(
    @Inject(EMPRESA_REPOSITORY)
    private readonly repo: IEmpresaRepository,
  ) {}

  execute(dto: CreateEmpresaDto) {
    return this.repo.create({
      razon_social: dto.razon_social,
      ruc: dto.ruc,
      direccion: dto.direccion,
      telefono: dto.telefono,
      email: dto.email,
      representante_legal: dto.representante_legal,
      estado: 1,
    });
  }
}

export default CreateEmpresaUseCase;
