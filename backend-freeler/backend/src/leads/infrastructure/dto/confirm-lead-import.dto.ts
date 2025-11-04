import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmLeadImportDto {
  @ApiProperty({ example: 'f3c6b8b2-8c1d-4e22-9acf-12f4e3e6d1a2' })
  @IsString()
  @MinLength(8)
  importId!: string;

  @ApiProperty({
    example: {
      nombres: 'Nombre',
      apellidos: 'Apellido',
      email: 'Correo',
      telefono: 'Telefono',
      origen: 'Origen',
      id_campania: 'ID Campana',
    },
    description:
      'Mapa entre los campos del sistema y las columnas detectadas en el archivo.',
  })
  @IsObject()
  mapping!: Record<string, string>;

  @ApiPropertyOptional({
    example: 'Importado',
    description: 'Valor por defecto para el campo origen si no se encuentra en el archivo.',
  })
  @IsOptional()
  @IsString()
  defaultOrigen?: string;
}

export default ConfirmLeadImportDto;
