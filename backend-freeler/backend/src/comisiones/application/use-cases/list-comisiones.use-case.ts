import { Inject, Injectable } from '@nestjs/common';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';
import FindComisionesDto from '../../infrastructure/dto/find-comisiones.dto';

@Injectable()
export class ListComisionesUseCase {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly repo: IComisionRepository,
  ) {}

  execute(filters: FindComisionesDto) {
    return this.repo.paginate(filters);
  }
}

export default ListComisionesUseCase;
