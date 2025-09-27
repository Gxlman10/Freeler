import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('asignaciones')
@Controller('asignaciones')
export class AsignacionesController {
  @Get('ping')
  ping() {
    return { ok: true, resource: 'asignaciones' };
  }
}
