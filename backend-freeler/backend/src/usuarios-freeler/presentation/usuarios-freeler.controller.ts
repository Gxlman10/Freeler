import {
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
import { CreateUsuarioFreelerDto } from '../infrastructure/dto/create-usuario-freeler.dto';
import { UpdateUsuarioFreelerDto } from '../infrastructure/dto/update-usuario-freeler.dto';
import { PaginationDto } from '../../shared/application/dto/pagination.dto';
import { RegisterUsuarioFreelerUseCase } from '../application/use-cases/register-usuario-freeler.use-case';
import { FindUsuarioFreelerUseCase } from '../application/use-cases/find-usuario-freeler.use-case';
import { UpdateUsuarioFreelerUseCase } from '../application/use-cases/update-usuario-freeler.use-case';
import { ListUsuariosFreelerUseCase } from '../application/use-cases/list-usuarios-freeler.use-case';
import { SoftDeleteUsuarioFreelerUseCase } from '../application/use-cases/soft-delete-usuario-freeler.use-case';
import { GetUsuarioStatsUseCase } from '../application/use-cases/get-usuario-stats.use-case';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

type DbCheckResponse = {
  db: string | null;
  usr: string | null;
  schemas: unknown;
  regclass: string | null;
};

const isUnknownArray = (value: unknown): value is unknown[] =>
  Array.isArray(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

@ApiTags('usuarios-freeler')
@Controller('usuarios-freeler')
export class UsuariosFreelerController {
  constructor(
    private readonly registerUC: RegisterUsuarioFreelerUseCase,
    private readonly findUC: FindUsuarioFreelerUseCase,
    private readonly updateUC: UpdateUsuarioFreelerUseCase,
    private readonly listUC: ListUsuariosFreelerUseCase,
    private readonly softDelUC: SoftDeleteUsuarioFreelerUseCase,
    private readonly statsUC: GetUsuarioStatsUseCase,
    private readonly ds: DataSource,
    private readonly jwt: JwtService,
  ) {}

  @Get('db-check')
  async dbCheck() {
    const rows: unknown = await this.ds.query(`
        SELECT
        current_database()  AS db,
        current_user        AS usr,
        current_schemas(true) AS schemas,
        to_regclass('freeler.usuario_freeler') AS regclass
    `);

    if (!isUnknownArray(rows)) {
      return null;
    }

    const [row] = rows;
    if (!isRecord(row)) {
      return null;
    }

    const response: DbCheckResponse = {
      db: typeof row.db === 'string' ? row.db : null,
      usr: typeof row.usr === 'string' ? row.usr : null,
      schemas: row.schemas ?? null,
      regclass: typeof row.regclass === 'string' ? row.regclass : null,
    };

    return response;
  }

  @ApiOperation({ summary: 'Registrar usuario freeler y devolver JWT' })
  @ApiOkResponse({ description: 'Token emitido' })
  @Post('register')
  async register(@Body() dto: CreateUsuarioFreelerDto) {
    const user = await this.registerUC.execute(dto);
    const payload = {
      sub: (user as any).id_usuario_freeler,
      type: 'freeler' as const,
      email: user.email,
    };
    return { access_token: await this.jwt.signAsync(payload) };
  }

  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.findUC.byId(id);
  }

  @ApiOperation({ summary: 'Actualizar usuario' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioFreelerDto) {
    return this.updateUC.execute(Number(id), dto);
  }

  @ApiOperation({ summary: 'Listar usuarios' })
  @Get()
  list(@Query() q: PaginationDto) {
    return this.listUC.execute(q);
  }

  @ApiOperation({ summary: 'Desactivar (soft-delete) usuario' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.softDelUC.execute(Number(id));
  }

  @ApiOperation({ summary: 'Stats del usuario' })
  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.statsUC.execute(id);
  }

  @Get('ping')
  ping() {
    return { ok: true, resource: 'usuarios-freeler' };
  }
}
export default UsuariosFreelerController;
