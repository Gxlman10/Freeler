import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class BulkUpdateAsignacionesDto {
  @ApiProperty({
    example: 100,
    description: 'Actor: usuario empresa que ejecuta la acción',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actorUsuarioEmpresaId!: number;

  @ApiProperty({ example: 'activo', enum: ['activo', 'inactivo'] })
  @IsIn(['activo', 'inactivo'])
  estadoObjetivo!: 'activo' | 'inactivo';

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_campania?: number;

  @ApiPropertyOptional({ example: [1, 2, 3] })
  @IsOptional()
  leadIds?: number[];

  @ApiPropertyOptional({
    example: 101,
    description: 'Asignaciones del usuario-empresa especificado',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioEmpresaIdAsignado?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Si true, solo afectará asignaciones actualmente inactivas',
  })
  @IsOptional()
  @IsBoolean()
  soloInactivas?: boolean;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  fecha_desde?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsString()
  fecha_hasta?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Si true, no aplica cambios; devuelve cantidad potencial',
  })
  @IsOptional()
  @IsBoolean()
  simulate?: boolean;

  @ApiPropertyOptional({
    example: 500,
    description: 'Máximo de filas a afectar',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  maxRows?: number;
}

export default BulkUpdateAsignacionesDto;
