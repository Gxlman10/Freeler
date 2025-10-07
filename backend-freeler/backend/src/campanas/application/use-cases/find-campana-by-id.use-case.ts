import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CAMPANA_REPOSITORY,
  ICampanaRepository,
} from '../interfaces/campana.repository.interface';

@Injectable()
export class FindCampanaByIdUseCase {
  constructor(
    @Inject(CAMPANA_REPOSITORY)
    private readonly repo: ICampanaRepository,
  ) {}

  async execute(id: string | number) {
    const campana = await this.repo.findById(Number(id));
    if (!campana) throw new NotFoundException('Campaña no encontrada');
    return campana;
  }
}

export default FindCampanaByIdUseCase;
