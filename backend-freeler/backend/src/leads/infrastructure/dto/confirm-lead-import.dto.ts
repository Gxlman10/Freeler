import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString, Min, MinLength } from 'class-validator';

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
    },
    description:
      'Mapa entre los campos del sistema y las columnas detectadas en el archivo.',
  })
  @IsObject()
  mapping!: Record<string, string>;

  @ApiProperty({ example: 5, description: 'ID de la campaña a la que se asociarán los leads importados.' })
  @IsNumber()
  @Min(1)
  campaignId!: number;

  @ApiPropertyOptional({
    example: 'Operador CRM',
    description: 'Nombre o identificador del usuario que ejecuta la importación (se usa en el campo origen).',
  })
  @IsOptional()
  @IsString()
  actorLabel?: string;
}

export default ConfirmLeadImportDto;
