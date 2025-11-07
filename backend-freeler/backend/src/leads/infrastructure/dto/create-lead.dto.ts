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

export class CreateLeadDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'ID del usuario freeler que registró el lead (opcional para empresa).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioFreelerId?: number | null;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_campania!: number;

  @ApiProperty({ example: 'Landing Primavera' })
  @IsString()
  @Length(1, 255)
  origen!: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @Length(1, 255)
  nombres!: string;
  @ApiPropertyOptional({ example: 'Pérez', type: String })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  apellidos?: string | null;

  @ApiPropertyOptional({ example: '71384562', type: String })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dni?: string | null;
  @ApiPropertyOptional({ example: 'ana@example.com', type: String })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;
  @ApiProperty({ example: '+51987654321', type: String })
  @IsString()
  @Length(1, 255)
  telefono!: string;
  @ApiPropertyOptional({ example: 'Estudiante', type: String })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ocupacion?: string | null;
  @ApiPropertyOptional({ example: 'Lima', type: String })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ciudad?: string | null;
  @ApiPropertyOptional({ example: 'Interesado en plan premium', type: String })
  @Transform(sanitizeOptionalString)
  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  estado_completo?: boolean;
}

export default CreateLeadDto;
