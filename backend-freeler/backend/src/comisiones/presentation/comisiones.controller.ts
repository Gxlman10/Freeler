import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EstadoComisionEntity } from '../infrastructure/entities/estado-comision.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListComisionesUseCase } from '../application/use-cases/list-comisiones.use-case';
import { FindComisionByIdUseCase } from '../application/use-cases/find-comision-by-id.use-case';
import { GetComisionesStatsUseCase } from '../application/use-cases/get-comisiones-stats.use-case';
import FindComisionesDto from '../infrastructure/dto/find-comisiones.dto';
import { PayCommissionUseCase } from '../application/use-cases/pay-commission.use-case';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../shared/infrastructure/decorators/roles.decorator';
import ResolveCommissionPaymentDto from '../infrastructure/dto/resolve-commission-payment.dto';
import RequestCommissionPayoutUseCase from '../application/use-cases/request-commission-payout.use-case';
import RequestCommissionPayoutDto from '../infrastructure/dto/request-commission-payout.dto';
import GetFreelerCommissionsUseCase from '../application/use-cases/get-freeler-commissions.use-case';
import RequestFreelerMassPayoutUseCase from '../application/use-cases/request-freeler-mass-payout.use-case';

@ApiTags('comisiones')
@Controller('comisiones')
export class ComisionesController {
  constructor(
    private readonly requestPayoutUC: RequestCommissionPayoutUseCase,
    private readonly massPayoutUC: RequestFreelerMassPayoutUseCase,
    private readonly payUC: PayCommissionUseCase,
    private readonly listUC: ListComisionesUseCase,
    private readonly findUC: FindComisionByIdUseCase,
    private readonly statsUC: GetComisionesStatsUseCase,
    private readonly freelerSummaryUC: GetFreelerCommissionsUseCase,
    @InjectRepository(EstadoComisionEntity)
    private readonly estadoRepo: Repository<EstadoComisionEntity>,
  ) {}

  @ApiOperation({ summary: 'Solicitar pago de comisión (freeler)' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/request-payout')
  requestPayout(
    @Req() req: { user?: { sub?: number; type?: string } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestCommissionPayoutDto,
  ) {
    const user = req.user;
    if (!user || user.type !== 'freeler' || !user.sub) {
      throw new ForbiddenException();
    }
    return this.requestPayoutUC.execute(id, Number(user.sub), dto);
  }

  @ApiOperation({ summary: 'Actualizar estado de comisión (admin/supervisor)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Post(':id/pay')
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveCommissionPaymentDto,
  ) {
    return this.payUC.execute(id, dto?.estado ?? 'pagado');
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
  @ApiOperation({ summary: 'Resumen de comisiones del freeler autenticado' })
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  myCommissions(@Req() req: { user?: { sub?: number; type?: string } }) {
    const user = req.user;
    if (!user || user.type !== 'freeler' || !user.sub) {
      throw new ForbiddenException();
    }
    return this.freelerSummaryUC.execute(Number(user.sub));
  }

  @ApiOperation({ summary: 'Solicitar pago de todas las comisiones pendientes (freeler)' })
  @UseGuards(JwtAuthGuard)
  @Post('mine/request')
  requestMyPayout(
    @Req() req: { user?: { sub?: number; type?: string } },
    @Body() dto: RequestCommissionPayoutDto,
  ) {
    const user = req.user;
    if (!user || user.type !== 'freeler' || !user.sub) {
      throw new ForbiddenException();
    }
    return this.massPayoutUC.execute(Number(user.sub), dto);
  }
}
