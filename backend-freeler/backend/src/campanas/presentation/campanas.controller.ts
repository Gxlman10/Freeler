import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCampanaUseCase } from '../application/use-cases/create-campana.use-case';
import { DeleteCampanaUseCase } from '../application/use-cases/delete-campana.use-case';
import { FindCampanaByIdUseCase } from '../application/use-cases/find-campana-by-id.use-case';
import { FindCampanasUseCase } from '../application/use-cases/find-campanas.use-case';
import { GetCampanaStatsUseCase } from '../application/use-cases/get-campana-stats.use-case';
import { UpdateCampanaUseCase } from '../application/use-cases/update-campana.use-case';
import { CreateCampanaDto } from '../infrastructure/dto/create-campana.dto';
import { FindCampanasDto } from '../infrastructure/dto/find-campanas.dto';
import { UpdateCampanaDto } from '../infrastructure/dto/update-campana.dto';

@ApiTags('campanas')
@Controller('campanas')
export class CampanasController {
  constructor(
    private readonly createUC: CreateCampanaUseCase,
    private readonly findAllUC: FindCampanasUseCase,
    private readonly findByIdUC: FindCampanaByIdUseCase,
    private readonly updateUC: UpdateCampanaUseCase,
    private readonly deleteUC: DeleteCampanaUseCase,
    private readonly statsUC: GetCampanaStatsUseCase,
  ) {}

  @ApiOperation({ summary: 'Crear campaña' })
  @ApiOkResponse({ description: 'Campaña creada' })
  @Post()
  create(@Body() dto: CreateCampanaDto) {
    return this.createUC.execute(dto);
  }

  @ApiOperation({ summary: 'Listar campañas' })
  @Get()
  list(@Query() filters: FindCampanasDto) {
    return this.findAllUC.execute(filters);
  }

  @ApiOperation({ summary: 'Actualizar campaña' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampanaDto) {
    return this.updateUC.execute(Number(id), dto);
  }

  @ApiOperation({ summary: 'Desactivar (soft-delete) campaña' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('usuarioEmpresaId') usuarioEmpresaId?: string,
  ) {
    const actorId = Number(usuarioEmpresaId);
    if (!usuarioEmpresaId || Number.isNaN(actorId) || actorId <= 0) {
      throw new BadRequestException(
        'usuarioEmpresaId es requerido como query param',
      );
    }
    return this.deleteUC.execute(Number(id), actorId);
  }

  @ApiOperation({ summary: 'Estadísticas básicas de campañas' })
  @Get('stats/basic')
  stats() {
    return this.statsUC.execute();
  }

  @ApiOperation({ summary: 'Obtener campaña por ID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.findByIdUC.execute(id);
  }

  @Get('ping')
  ping() {
    return { ok: true, resource: 'campanas' };
  }
}
