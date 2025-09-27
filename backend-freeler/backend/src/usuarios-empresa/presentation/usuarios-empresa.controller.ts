import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('usuarios-empresa')
@Controller('usuarios-empresa')
export class UsuariosEmpresaController {
  @Get('ping')
  ping() {
    return { ok: true, resource: 'usuarios-empresa' };
  }
}
