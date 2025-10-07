import { Inject, Injectable } from '@nestjs/common';
import {
  CAMPANA_REPOSITORY,
  ICampanaRepository,
} from '../interfaces/campana.repository.interface';
import { FindCampanasDto } from '../../infrastructure/dto/find-campanas.dto';

@Injectable()
export class FindCampanasUseCase {
  constructor(
    @Inject(CAMPANA_REPOSITORY)
    private readonly repo: ICampanaRepository,
  ) {}

  execute(filters: FindCampanasDto) {
    return this.repo.paginate(filters);
  }
}

export default FindCampanasUseCase;
