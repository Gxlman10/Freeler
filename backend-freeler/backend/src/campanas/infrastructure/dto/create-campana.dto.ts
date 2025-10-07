import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateCampanaDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_empresa!: number;

  @ApiProperty({ example: 'Campaña Primavera 2025' })
  @IsString()
  @Length(2, 255)
  nombre!: string;

  @ApiPropertyOptional({ example: 'Campaña dirigida a leads de Lima' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  ubicacion?: string;

  @ApiProperty({ example: '150.50' })
  @Type(() => String)
  @IsDecimal({ decimal_digits: '0,2' })
  comision!: string;

  @ApiProperty({ example: '2025-10-01' })
  @IsDateString()
  fecha_inicio!: string;

  @ApiProperty({ example: '2025-12-31' })
  @IsDateString()
  fecha_fin!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Estado 1=activo, 0=inactivo',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estado?: number;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario empresa que ejecuta la acción',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioEmpresaId!: number;
}

export default CreateCampanaDto;
