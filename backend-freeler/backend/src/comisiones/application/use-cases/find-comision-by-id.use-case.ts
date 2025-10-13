import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';

@Injectable()
export class FindComisionByIdUseCase {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly repo: IComisionRepository,
  ) {}

  async execute(id: string | number) {
    const com = await this.repo.findById(Number(id));
    if (!com) throw new NotFoundException('COMISION_NOT_FOUND');
    return com;
  }
}

export default FindComisionByIdUseCase;
