import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EstadoComisionEntity } from '../infrastructure/entities/estado-comision.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListComisionesUseCase } from '../application/use-cases/list-comisiones.use-case';
import { FindComisionByIdUseCase } from '../application/use-cases/find-comision-by-id.use-case';
import { GetComisionesStatsUseCase } from '../application/use-cases/get-comisiones-stats.use-case';
import FindComisionesDto from '../infrastructure/dto/find-comisiones.dto';
import { PayCommissionUseCase } from '../application/use-cases/pay-commission.use-case';

@ApiTags('comisiones')
@Controller('comisiones')
export class ComisionesController {
  constructor(
    private readonly payUC: PayCommissionUseCase,
    private readonly listUC: ListComisionesUseCase,
    private readonly findUC: FindComisionByIdUseCase,
    private readonly statsUC: GetComisionesStatsUseCase,
    @InjectRepository(EstadoComisionEntity)
    private readonly estadoRepo: Repository<EstadoComisionEntity>,
  ) {}

  @ApiOperation({ summary: 'Pagar comisión (empresa admin/supervisor)' })
  @Post(':id/pay')
  pay(@Param('id') id: string) {
    // Este endpoint solo marca como pagada; el actor podría venir por JWT en el futuro
    return this.payUC.execute(Number(id));
  }

  @ApiOperation({ summary: 'Listar comisiones' })
  @Get()
  list(@Query() q: FindComisionesDto) {
    return this.listUC.execute(q);
  }

  @ApiOperation({ summary: 'Detalle de comisión' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.findUC.execute(id);
  }

  @ApiOperation({ summary: 'Estadísticas básicas de comisiones' })
  @Get('stats/basic')
  stats() {
    return this.statsUC.execute();
  }

  @ApiOperation({ summary: 'Catálogo: estados de comisiones' })
  @Get('catalogos/estado-comisiones')
  estadoComisionesCatalog() {
    return this.estadoRepo.find({ order: { id_estado_comision: 'ASC' } });
  }
  @Get('ping')
  ping() {
    return { ok: true, resource: 'comisiones' };
  }
}
