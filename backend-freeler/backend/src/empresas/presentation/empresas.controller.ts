import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../shared/application/dto/pagination.dto';
import { CreateEmpresaUseCase } from '../application/use-cases/create-empresa.use-case';
import { FindEmpresaUseCase } from '../application/use-cases/find-empresa.use-case';
import { ListEmpresasUseCase } from '../application/use-cases/list-empresas.use-case';
import { SoftDeleteEmpresaUseCase } from '../application/use-cases/soft-delete-empresa.use-case';
import { UpdateEmpresaUseCase } from '../application/use-cases/update-empresa.use-case';
import { CreateEmpresaDto } from '../infrastructure/dto/create-empresa.dto';
import { UpdateEmpresaDto } from '../infrastructure/dto/update-empresa.dto';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly createUC: CreateEmpresaUseCase,
    private readonly listUC: ListEmpresasUseCase,
    private readonly findUC: FindEmpresaUseCase,
    private readonly updateUC: UpdateEmpresaUseCase,
    private readonly softDeleteUC: SoftDeleteEmpresaUseCase,
  ) {}

  @ApiOperation({ summary: 'Registrar empresa' })
  @ApiOkResponse({ description: 'Empresa registrada' })
  @Post()
  create(@Body() dto: CreateEmpresaDto) {
    return this.createUC.execute(dto);
  }

  @ApiOperation({ summary: 'Listar empresas' })
  @Get()
  list(@Query() pagination: PaginationDto) {
    return this.listUC.execute(pagination);
  }

  @ApiOperation({ summary: 'Obtener empresa por ID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.findUC.byId(id);
  }

  @ApiOperation({ summary: 'Actualizar empresa' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.updateUC.execute(Number(id), dto);
  }

  @ApiOperation({ summary: 'Desactivar (soft-delete) empresa' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.softDeleteUC.execute(Number(id));
  }

  @Get('ping')
  ping() {
    return { ok: true, resource: 'empresas' };
  }
}
