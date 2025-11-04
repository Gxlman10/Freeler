import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../shared/application/dto/pagination.dto';

export class FindLeadsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'ana' })
  @IsOptional()
  @IsString()
  override search?: string = undefined;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_campania?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_usuario_freeler?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_estado_lead?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0') return false;
    }
    return value;
  })
  @IsBoolean()
  estado_completo?: boolean;

  @ApiPropertyOptional({
    example: [1, 2, 3],
    type: [Number],
    description: 'Filtrar por lista de campanas',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map((item) => Number(item)).filter((n) => !Number.isNaN(n));
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((n) => !Number.isNaN(n));
    }
    if (typeof value === 'number') return [value];
    return undefined;
  })
  @IsInt({ each: true })
  @Min(1, { each: true })
  id_campanias?: number[];

  @ApiPropertyOptional({
    example: 101,
    description: 'Filtrar por usuario-empresa asignado',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  asignado_a_usuario_empresa_id?: number;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;
}

export default FindLeadsDto;
