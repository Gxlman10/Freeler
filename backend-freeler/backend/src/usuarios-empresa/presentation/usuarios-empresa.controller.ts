import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../shared/application/dto/pagination.dto';
import { CreateUsuarioEmpresaUseCase } from '../application/use-cases/create-usuario-empresa.use-case';
import { FindUsuarioEmpresaUseCase } from '../application/use-cases/find-usuario-empresa.use-case';
import { ListUsuariosEmpresaUseCase } from '../application/use-cases/list-usuarios-empresa.use-case';
import { SoftDeleteUsuarioEmpresaUseCase } from '../application/use-cases/soft-delete-usuario-empresa.use-case';
import { UpdateUsuarioEmpresaUseCase } from '../application/use-cases/update-usuario-empresa.use-case';
import { CreateUsuarioEmpresaDto } from '../infrastructure/dto/create-usuario-empresa.dto';
import { UpdateUsuarioEmpresaDto } from '../infrastructure/dto/update-usuario-empresa.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../shared/infrastructure/decorators/roles.decorator';

@ApiTags('usuarios-empresa')
@Controller('usuarios-empresa')
export class UsuariosEmpresaController {
  constructor(
    private readonly createUC: CreateUsuarioEmpresaUseCase,
    private readonly listUC: ListUsuariosEmpresaUseCase,
    private readonly findUC: FindUsuarioEmpresaUseCase,
    private readonly updateUC: UpdateUsuarioEmpresaUseCase,
    private readonly softDeleteUC: SoftDeleteUsuarioEmpresaUseCase,
  ) {}

  @ApiOperation({ summary: 'Registrar usuario de empresa' })
  @ApiOkResponse({ description: 'Usuario empresa registrado' })
  @Post()
  create(@Body() dto: CreateUsuarioEmpresaDto) {
    return this.createUC.execute(dto);
  }

  @ApiOperation({ summary: 'Listar usuarios de empresa' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'analista')
  @Get()
  async list(
    @Req() req: { user?: { type?: string; sub?: number } },
    @Query() pagination: PaginationDto,
  ) {
    const user = req.user;
    if (!user || user.type !== 'empresa') {
      throw new ForbiddenException();
    }
    const actorId = Number(user.sub);
    if (!Number.isFinite(actorId)) {
      throw new ForbiddenException();
    }
    const actor = await this.findUC.byId(actorId);

    // Intentamos obtener el id de empresa desde la relación o el campo directo
    const companyId =
      actor.empresa?.id_empresa ??
      actor.id_empresa ??
      pagination.id_empresa;

    if (!companyId) {
      throw new ForbiddenException('USUARIO_SIN_EMPRESA');
    }

    // Evitamos que el actor fuerce otra empresa distinta vía query params
    if (
      pagination.id_empresa &&
      pagination.id_empresa !== companyId
    ) {
      throw new ForbiddenException('EMPRESA_NO_AUTORIZADA');
    }

    // A partir de aquí siempre devolvemos usuarios pertenecientes a la empresa del actor
    return this.listUC.execute({ ...pagination, id_empresa: companyId });
  }

  @ApiOperation({ summary: 'Obtener usuario de empresa por ID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.findUC.byId(id);
  }

  @ApiOperation({ summary: 'Actualizar usuario de empresa' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioEmpresaDto) {
    return this.updateUC.execute(Number(id), dto);
  }

  @ApiOperation({ summary: 'Desactivar (soft-delete) usuario de empresa' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.softDeleteUC.execute(Number(id));
  }

  @Get('ping')
  ping() {
    return { ok: true, resource: 'usuarios-empresa' };
  }
}
