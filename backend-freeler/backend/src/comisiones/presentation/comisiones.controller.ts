import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('comisiones')
@Controller('comisiones')
export class ComisionesController {
  @Get('ping')
  ping() {
    return { ok: true, resource: 'comisiones' };
  }
}
