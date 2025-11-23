import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import IaConfigService from '../application/services/ia-config.service';
import UpdateIaConfigDto from '../infrastructure/dto/update-ia-config.dto';
import ChatRequestDto from '../infrastructure/dto/chat-request.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../shared/infrastructure/decorators/roles.decorator';

@ApiTags('ia-config')
@ApiBearerAuth()
@Controller('ia-config')
export class IaConfigController {
  constructor(private readonly service: IaConfigService) {}

  @ApiOperation({ summary: 'Obtener configuración actual de IA (admin/supervisor)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  @Get()
  getConfig() {
    return this.service.getConfig();
  }

  @ApiOperation({ summary: 'Actualizar token y parámetros de IA (solo admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put()
  update(@Body() dto: UpdateIaConfigDto) {
    return this.service.updateConfig(dto);
  }

  @ApiOperation({ summary: 'Conversar con la IA de capacitación (freeler y empresa)' })
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  chat(@Body() dto: ChatRequestDto) {
    return this.service.createChat(dto);
  }
}

export default IaConfigController;
