import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateEmpresaDto {
  @ApiProperty({ example: 'Freeler SAC' })
  @IsString()
  @Length(2, 255)
  razon_social!: string;

  @ApiProperty({ example: '20601234567', description: 'RUC de 11 dígitos' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'RUC debe tener 11 dígitos' })
  ruc!: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 742' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({ example: '+51987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  telefono?: string;

  @ApiPropertyOptional({ example: 'contacto@freeler.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  representante_legal?: string;
}

export default CreateEmpresaDto;
