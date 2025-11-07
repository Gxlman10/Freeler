import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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

const sanitizeOptionalString = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export class CreateLeadDraftDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'ID del usuario freeler que crea el borrador (opcional para empresa).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioFreelerId?: number | null;

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

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @Length(1, 255)
  nombres!: string;
  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @Length(1, 255)
  apellidos!: string;
  @ApiPropertyOptional({ example: '71384562' })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dni?: string | null;
  @ApiPropertyOptional({ example: 'ana@example.com' })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;
  @ApiPropertyOptional({ example: '+51987654321' })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telefono?: string | null;
  @ApiPropertyOptional({ example: 'Estudiante' })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ocupacion?: string | null;
  @ApiPropertyOptional({ example: 'Lima' })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ciudad?: string | null;
  @ApiPropertyOptional({ example: 'Interesado en plan premium' })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  estado_completo?: boolean;
}

export default CreateLeadDraftDto;
