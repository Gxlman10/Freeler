import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../shared/infrastructure/decorators/roles.decorator';
import { UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { CreateLeadDraftUseCase } from '../application/use-cases/create-lead-draft.use-case';
import { CreateLeadUseCase } from '../application/use-cases/create-lead.use-case';
import { UpdateLeadUseCase } from '../application/use-cases/update-lead.use-case';
import { FindLeadsByUserUseCase } from '../application/use-cases/find-leads-by-user.use-case';
import { FindLeadsByCampaignUseCase } from '../application/use-cases/find-leads-by-campaign.use-case';
import { FindLeadByIdUseCase } from '../application/use-cases/find-lead-by-id.use-case';
import { AssignLeadUseCase } from '../application/use-cases/assign-lead.use-case';
import { UpdateLeadStatusUseCase } from '../application/use-cases/update-lead-status.use-case';
import { MarkLeadAsSoldUseCase } from '../application/use-cases/mark-lead-as-sold.use-case';
import { UpdateAsignacionUseCase } from '../application/use-cases/update-asignacion.use-case';
import { BulkUpdateAsignacionesUseCase } from '../application/use-cases/bulk-update-asignaciones.use-case';
import { CreateLeadDraftDto } from '../infrastructure/dto/create-lead-draft.dto';
import { CreateLeadDto } from '../infrastructure/dto/create-lead.dto';
import { UpdateLeadDto } from '../infrastructure/dto/update-lead.dto';
import { FindLeadsDto } from '../infrastructure/dto/find-leads.dto';
import { AssignLeadDto } from '../infrastructure/dto/assign-lead.dto';
import { UpdateLeadStatusDto } from '../infrastructure/dto/update-lead-status.dto';
import { MarkLeadSoldDto } from '../infrastructure/dto/mark-lead-sold.dto';
import { SelfAssignLeadDto } from '../infrastructure/dto/self-assign-lead.dto';
import { UpdateAsignacionDto } from '../infrastructure/dto/update-asignacion.dto';
import { BulkUpdateAsignacionesDto } from '../infrastructure/dto/bulk-update-asignaciones.dto';
import { ListEstadoLeadUseCase } from '../application/use-cases/list-estado-lead.use-case';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly createDraftUC: CreateLeadDraftUseCase,
    private readonly createUC: CreateLeadUseCase,
    private readonly updateUC: UpdateLeadUseCase,
    private readonly listByUserUC: FindLeadsByUserUseCase,
    private readonly listByCampUC: FindLeadsByCampaignUseCase,
    private readonly findByIdUC: FindLeadByIdUseCase,
    private readonly assignUC: AssignLeadUseCase,
    private readonly updateAsignUC: UpdateAsignacionUseCase,
    private readonly statusUC: UpdateLeadStatusUseCase,
    private readonly markSoldUC: MarkLeadAsSoldUseCase,
    private readonly listEstadoLeadUC: ListEstadoLeadUseCase,
    private readonly bulkAsignUC: BulkUpdateAsignacionesUseCase,
  ) {}

  @ApiOperation({ summary: 'Crear lead en borrador (freeler)' })
  @ApiOkResponse({ description: 'Lead borrador creado' })
  @UseGuards(JwtAuthGuard)
  @Post('draft')
  createDraft(
    @Body() dto: CreateLeadDraftDto,
    @Req() req: { user?: { type?: string; sub?: number } },
  ) {
    const user = req.user;
    if (user?.type !== 'freeler' || !user.sub) throw new ForbiddenException();
    return this.createDraftUC.execute({
      ...dto,
      usuarioFreelerId: Number(user.sub),
    });
  }

  @ApiOperation({ summary: 'Crear lead completo (freeler)' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateLeadDto,
    @Req() req: { user?: { type?: string; sub?: number } },
  ) {
    const user = req.user;
    if (user?.type !== 'freeler' || !user.sub) throw new ForbiddenException();
    return this.createUC.execute({
      ...dto,
      usuarioFreelerId: Number(user.sub),
    });
  }

  @ApiOperation({ summary: 'Actualizar lead' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.updateUC.execute(Number(id), dto);
  }

  @ApiOperation({ summary: 'Listar leads con filtros' })
  @Get()
  list(@Query() q: FindLeadsDto) {
    return this.listByUserUC.execute(q);
  }

  @ApiOperation({ summary: 'Listar leads por campaña' })
  @Get('by-campana/:id')
  listByCamp(@Param('id') id: string, @Query() q: FindLeadsDto) {
    return this.listByCampUC.execute({ ...q, id_campania: Number(id) });
  }

  @ApiOperation({
    summary: 'Asignar lead a usuario empresa (admin/supervisor)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Post('assign')
  assign(@Body() dto: AssignLeadDto) {
    return this.assignUC.execute(dto);
  }

  @ApiOperation({ summary: 'Autoasignar lead a mí (empresa)' })
  @Post('assign/self')
  assignSelf(@Body() dto: SelfAssignLeadDto) {
    return this.assignUC.execute({
      leadId: dto.leadId,
      usuarioEmpresaId: dto.usuarioEmpresaId,
      asignarAUsuarioEmpresaId: dto.usuarioEmpresaId,
    });
  }

  @ApiOperation({ summary: 'Cambiar estado del lead (empresa)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Post('status')
  changeStatus(@Body() dto: UpdateLeadStatusDto) {
    return this.statusUC.execute(dto);
  }

  @ApiOperation({
    summary: 'Marcar lead como vendido y generar comisión (empresa)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Post('mark-sold')
  markSold(@Body() dto: MarkLeadSoldDto) {
    return this.markSoldUC.execute(dto);
  }

  @ApiOperation({
    summary: 'Actualizar estado de asignación (activo/inactivo)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Patch('assignments/:id')
  updateAsign(@Param('id') id: string, @Body() dto: UpdateAsignacionDto) {
    return this.updateAsignUC.execute(Number(id), dto);
  }

  @ApiOperation({
    summary:
      'Actualización masiva de asignaciones por filtros (admin/supervisor)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Patch('assignments/bulk')
  bulkUpdateAsignaciones(@Body() dto: BulkUpdateAsignacionesDto) {
    return this.bulkAsignUC.execute(dto);
  }

  @ApiOperation({ summary: 'Catálogo: estados de lead' })
  @Get('catalogos/estado-lead')
  estadoLeadCatalog() {
    return this.listEstadoLeadUC.execute();
  }

  @ApiOperation({ summary: 'Detalle de lead' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.findByIdUC.execute(id);
  }

  @ApiOperation({ summary: 'Mis leads (freeler)' })
  @Get('mine/by-user/:usuarioFreelerId')
  mine(
    @Param('usuarioFreelerId') usuarioFreelerId: string,
    @Query() q: FindLeadsDto,
  ) {
    return this.listByUserUC.execute({
      ...q,
      id_usuario_freeler: Number(usuarioFreelerId),
    });
  }

  @ApiOperation({ summary: 'Leads asignados a mi (empresa)' })
  @UseGuards(JwtAuthGuard)
  @Get('assigned-to-me')
  assignedToMe(
    @Req() req: { user?: { type?: string; sub?: number } },
    @Query() q: FindLeadsDto,
  ) {
    const user = req.user;
    if (user?.type !== 'empresa' || !user.sub) throw new ForbiddenException();
    return this.listByUserUC.execute({
      ...q,
      asignado_a_usuario_empresa_id: Number(user.sub),
    });
  }
  @Get('ping')
  ping() {
    return { ok: true, resource: 'leads' };
  }
}
