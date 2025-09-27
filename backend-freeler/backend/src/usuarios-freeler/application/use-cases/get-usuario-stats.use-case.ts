import { Injectable } from '@nestjs/common';

@Injectable()
export class GetUsuarioStatsUseCase {
  async execute(userId: string | number) {
    return { userId, leadsReferidos: 0, comisionesPendientes: 0, comisionesPagadas: 0 };
  }
}
export default GetUsuarioStatsUseCase;
