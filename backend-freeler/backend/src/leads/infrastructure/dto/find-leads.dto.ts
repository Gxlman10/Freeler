import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  @IsBoolean()
  estado_completo?: boolean;

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
