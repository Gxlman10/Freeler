import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('campanas')
@Controller('campanas')
export class CampanasController {
  @Get('ping')
  ping() {
    return { ok: true, resource: 'campanas' };
  }
}
