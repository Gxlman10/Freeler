import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import DocumentosService from '../application/services/documentos.service';
import DniResponseDto from '../infrastructure/dto/dni-response.dto';
import RucResponseDto from '../infrastructure/dto/ruc-response.dto';

@ApiTags('documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @ApiOperation({
    summary: 'Consultar datos de persona por DNI',
    description:
      'Consulta ApiPeru para rellenar los campos del formulario. Si la consulta principal falla se intenta con un proveedor alterno.',
  })
  @ApiParam({
    name: 'dni',
    example: '70030684',
    description: 'Documento Nacional de Identidad (8 digitos)',
  })
  @ApiOkResponse({
    type: DniResponseDto,
    description: 'Datos obtenidos para el DNI solicitado',
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron datos para el DNI indicado',
  })
  @Get('dni/:dni')
  async consultarDni(@Param('dni') dni: string): Promise<DniResponseDto> {
    if (!/^\d{8}$/.test(dni)) {
      throw new NotFoundException('DNI_INVALIDO');
    }
    const resultado = await this.documentosService.consultarDni(dni);
    if (!resultado) {
      throw new NotFoundException('DNI_NO_ENCONTRADO');
    }
    return resultado;
  }

  @ApiOperation({
    summary: 'Consultar datos de empresa por RUC',
    description:
      'Consulta ApiPeru para rellenar los campos del formulario de empresa. Si la consulta principal falla se intenta con un proveedor alterno.',
  })
  @ApiParam({
    name: 'ruc',
    example: '20131312955',
    description: 'Registro Único de Contribuyentes (11 digitos)',
  })
  @ApiOkResponse({
    type: RucResponseDto,
    description: 'Datos empresariales hallados para el RUC indicado',
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron datos para el RUC indicado',
  })
  @Get('ruc/:ruc')
  async consultarRuc(@Param('ruc') ruc: string): Promise<RucResponseDto> {
    if (!/^\d{11}$/.test(ruc)) {
      throw new NotFoundException('RUC_INVALIDO');
    }
    const resultado = await this.documentosService.consultarRuc(ruc);
    if (!resultado) {
      throw new NotFoundException('RUC_NO_ENCONTRADO');
    }
    return resultado;
  }
}

export default DocumentosController;
