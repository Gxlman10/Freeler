import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  @Get('ping')
  ping() {
    return { ok: true, resource: 'empresas' };
  }
}
