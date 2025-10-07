import { Injectable } from '@nestjs/common';

@Injectable()
export class GetCampanaStatsUseCase {
  execute() {
    return { total: 0, activas: 0, inactivas: 0 };
  }
}

export default GetCampanaStatsUseCase;
