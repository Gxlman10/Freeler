import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  @Get('ping')
  ping() {
    return { ok: true, resource: 'leads' };
  }
}
