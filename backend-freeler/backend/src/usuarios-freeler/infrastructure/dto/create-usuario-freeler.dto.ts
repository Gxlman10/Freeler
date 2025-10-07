import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUsuarioFreelerDto {
  @ApiProperty({ example: 'Ana María' })
  @IsString()
  @Length(2, 100)
  nombres!: string;

  @ApiProperty({ example: 'García Paredes' })
  @IsString()
  @Length(2, 100)
  apellidos!: string;

  @ApiProperty({ example: '71384562' })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'DNI debe tener 8 dígitos' })
  dni!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '+51987654321', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  telefono?: string;

  @ApiProperty({ example: 'Secr3tP4ss!' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  password!: string;
}
