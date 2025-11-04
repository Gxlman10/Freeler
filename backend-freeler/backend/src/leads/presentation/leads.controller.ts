import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../shared/infrastructure/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { CreateLeadDraftUseCase } from '../application/use-cases/create-lead-draft.use-case';
import { CreateLeadUseCase } from '../application/use-cases/create-lead.use-case';
import { UpdateLeadUseCase } from '../application/use-cases/update-lead.use-case';
import { FindLeadsByUserUseCase } from '../application/use-cases/find-leads-by-user.use-case';
import { FindLeadsByCampaignUseCase } from '../application/use-cases/find-leads-by-campaign.use-case';
import { FindLeadsByEmpresaUseCase } from '../application/use-cases/find-leads-by-empresa.use-case';
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
import { RefreshLeadCreatedAtUseCase } from '../application/use-cases/refresh-lead-created-at.use-case';
import { ConfirmLeadImportDto } from '../infrastructure/dto/confirm-lead-import.dto';
import LeadsPermissionService from '../application/services/leads-permission.service';
import {
  LeadImportService,
  ImportUploadedFile,
} from '../application/services/lead-import.service';

const uploadTempDir = path.resolve(process.cwd(), 'tmp', 'lead-upload-buffer');
if (!existsSync(uploadTempDir)) {
  mkdirSync(uploadTempDir, { recursive: true });
}

const leadImportMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadTempDir),
    filename: (_req, file, cb) => {
      const sanitized = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${sanitized}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('FILE_TYPE_NOT_SUPPORTED'), false);
    }
  },
};

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly createDraftUC: CreateLeadDraftUseCase,
    private readonly createUC: CreateLeadUseCase,
    private readonly updateUC: UpdateLeadUseCase,
    private readonly listByUserUC: FindLeadsByUserUseCase,
    private readonly listByCampUC: FindLeadsByCampaignUseCase,
    private readonly listByEmpresaUC: FindLeadsByEmpresaUseCase,
    private readonly findByIdUC: FindLeadByIdUseCase,
    private readonly assignUC: AssignLeadUseCase,
    private readonly updateAsignUC: UpdateAsignacionUseCase,
    private readonly statusUC: UpdateLeadStatusUseCase,
    private readonly markSoldUC: MarkLeadAsSoldUseCase,
    private readonly listEstadoLeadUC: ListEstadoLeadUseCase,
    private readonly bulkAsignUC: BulkUpdateAsignacionesUseCase,
    private readonly refreshCreatedAtUC: RefreshLeadCreatedAtUseCase,
    private readonly permission: LeadsPermissionService,
    private readonly importService: LeadImportService,
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

  @ApiOperation({ summary: 'Refrescar fecha de creaciÃ³n del lead' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/refresh-created-at')
  refreshCreatedAt(
    @Param('id') id: string,
    @Req() req: { user?: { type?: string; sub?: number } },
  ) {
    const user = req.user;
    if (user?.type !== 'freeler' || !user.sub) throw new ForbiddenException();
    return this.refreshCreatedAtUC.execute(Number(id), {
      actorId: Number(user.sub),
      actorType: 'freeler',
    });
  }

  @ApiOperation({ summary: 'Listar leads con filtros' })
  @Get()
  list(@Query() q: FindLeadsDto) {
    return this.listByUserUC.execute(q);
  }

  @ApiOperation({ summary: 'Listar leads por campaÃ±a' })
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

  @ApiOperation({ summary: 'Autoasignar lead a mÃ­ (empresa)' })
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
  @Roles('admin', 'supervisor', 'vendedor')
  @Post('status')
  changeStatus(@Body() dto: UpdateLeadStatusDto) {
    return this.statusUC.execute(dto);
  }

  @ApiOperation({
    summary: 'Marcar lead como vendido y generar comisiÃ³n (empresa)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Post('mark-sold')
  markSold(@Body() dto: MarkLeadSoldDto) {
    return this.markSoldUC.execute(dto);
  }

  @ApiOperation({
    summary: 'Actualizar estado de asignaciÃ³n (activo/inactivo)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Patch('assignments/:id')
  updateAsign(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAsignacionDto) {
    return this.updateAsignUC.execute(id, dto);
  }

  @ApiOperation({
    summary:
      'ActualizaciÃ³n masiva de asignaciones por filtros (admin/supervisor)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Patch('assignments/bulk')
  bulkUpdateAsignaciones(@Body() dto: BulkUpdateAsignacionesDto) {
    return this.bulkAsignUC.execute(dto);
  }

  @ApiOperation({ summary: 'CatÃ¡logo: estados de lead' })
  @Get('catalogos/estado-lead')
  estadoLeadCatalog() {
    return this.listEstadoLeadUC.execute();
  }

  @ApiOperation({ summary: 'Leads por empresa (CRM)' })
  @UseGuards(JwtAuthGuard)
  @Get('by-empresa')
  leadsByEmpresa(
    @Req() req: { user?: { type?: string; sub?: number } },
    @Query() q: FindLeadsDto,
  ) {
    const user = req.user;
    if (user?.type !== 'empresa' || !user.sub) throw new ForbiddenException();
    return this.listByEmpresaUC.execute(Number(user.sub), q);
  }

  @ApiOperation({ summary: 'Descargar plantilla de importacion de leads' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Get('import/template')
  async downloadTemplate(@Res() res: Response) {
    const content = await this.importService.generateTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=\"plantilla_leads.csv\"');
    res.send(content);
  }

  @ApiOperation({ summary: 'Previsualizar importacion de leads' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @UseInterceptors(FileInterceptor('file', leadImportMulterOptions))
  @Post('import/preview')
  async previewImport(
    @Req() req: { user?: { type?: string; sub?: number } },
    @UploadedFile() file: ImportUploadedFile | undefined,
  ) {
    const user = req.user;
    if (user?.type !== 'empresa' || !user.sub) throw new ForbiddenException();
    await this.permission.ensureEmpresaActor(Number(user.sub));
    return this.importService.preparePreview(file);
  }

  @ApiOperation({ summary: 'Confirmar importacion de leads' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Post('import/confirm')
  async confirmImport(
    @Req() req: { user?: { type?: string; sub?: number } },
    @Body() dto: ConfirmLeadImportDto,
  ) {
    const user = req.user;
    if (user?.type !== 'empresa' || !user.sub) throw new ForbiddenException();
    const actor = await this.permission.ensureEmpresaActor(Number(user.sub));
    if (!actor.empresa?.id_empresa) {
      throw new ForbiddenException('USUARIO_SIN_EMPRESA');
    }
    return this.importService.processImport({
      importId: dto.importId,
      mapping: dto.mapping,
      defaultOrigen: dto.defaultOrigen,
      usuarioEmpresaId: actor.id_usuario_empresa,
    });
  }

  @ApiOperation({ summary: 'Detalle de lead' })
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.findByIdUC.execute(id);
  }

  @ApiOperation({ summary: 'Mis leads (freeler)' })
  @Get('mine/by-user/:usuarioFreelerId')
  mine(
    @Param('usuarioFreelerId', ParseIntPipe) usuarioFreelerId: number,
    @Query() q: FindLeadsDto,
  ) {
    return this.listByUserUC.execute({
      ...q,
      id_usuario_freeler: usuarioFreelerId,
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


