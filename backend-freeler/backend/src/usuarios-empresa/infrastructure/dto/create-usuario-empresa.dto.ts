import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUsuarioEmpresaDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_empresa!: number;

  @ApiProperty({
    example: 2,
    description: 'Rol: 1-Superadmin, 2-Vendedor, 3-Analitica',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_rol!: number;

  @ApiProperty({ example: 'María' })
  @IsString()
  @Length(2, 255)
  nombres!: string;

  @ApiProperty({ example: 'Fernández' })
  @IsString()
  @Length(2, 255)
  apellidos!: string;

  @ApiProperty({ example: 'maria@empresa.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Secr3tP4ss!' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  password!: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Estado 1=activo, 0=inactivo',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  estado?: number;
}

export default CreateUsuarioEmpresaDto;
