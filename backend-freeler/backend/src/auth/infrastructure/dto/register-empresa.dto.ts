import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterEmpresaDto {
  @ApiProperty({ example: 'Mi Empresa SAC' })
  @IsString()
  @Length(2, 255)
  nombre_empresa!: string;

  @ApiProperty({ example: '20601234567', description: 'RUC 11 dígitos' })
  @IsString()
  @Matches(/^\d{11}$/)
  ruc!: string;

  @ApiProperty({ example: 'contacto@empresa.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Secr3tP4ss' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password!: string;

  @ApiPropertyOptional({ example: '+51987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 742' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;
}

export default RegisterEmpresaDto;

