import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLeadDraftDto {
  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioFreelerId!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_campania?: number;

  @ApiProperty({
    example: 'Borrador',
    description:
      'Origen requerido por BD; usamos un valor por defecto si no viene',
  })
  @IsString()
  @Length(1, 255)
  origen!: string;

  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  nombres?: string;
  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  apellidos?: string;
  @ApiPropertyOptional({ example: '71384562' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dni?: string;
  @ApiPropertyOptional({ example: 'ana@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
  @ApiPropertyOptional({ example: '+51987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telefono?: string;
  @ApiPropertyOptional({ example: 'Estudiante' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ocupacion?: string;
  @ApiPropertyOptional({ example: 'Lima' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ciudad?: string;
  @ApiPropertyOptional({ example: 'Interesado en plan premium' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  estado_completo?: boolean;
}

export default CreateLeadDraftDto;
