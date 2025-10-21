import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEntity } from '../infrastructure/entities/rol.entity';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    @InjectRepository(RolEntity)
    private readonly repo: Repository<RolEntity>,
  ) {}

  @ApiOperation({ summary: 'Listar roles' })
  @Get()
  list() {
    return this.repo.find({ order: { id_rol: 'ASC' } });
  }

  @Get('ping')
  ping() {
    return { ok: true, resource: 'roles' };
  }
}

export default RolesController;
