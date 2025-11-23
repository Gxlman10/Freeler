import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateIaConfigDto {
  @ApiPropertyOptional({
    description: 'Token del proveedor (se guarda de forma segura en la base de datos)',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    description: 'Proveedor de IA (openai o gemini)',
    example: 'openai',
  })
  @IsOptional()
  @IsString()
  provider?: 'openai' | 'gemini' | 'groq';

  @ApiPropertyOptional({
    description: 'Mensaje base que define el comportamiento de la IA',
  })
  @IsOptional()
  @IsString()
  basePrompt?: string;

  @ApiPropertyOptional({
    description: 'Modelo a utilizar (por defecto gpt-3.5-turbo)',
    example: 'gpt-3.5-turbo',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Temperatura creativa de la IA',
    example: 0.35,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Nivel de guia para mantener el contexto',
    example: 0.6,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  @Max(1)
  guidance?: number;

  @ApiPropertyOptional({
    description: 'Maximo de tokens por respuesta',
    example: 600,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(128)
  @Max(2048)
  maxTokens?: number;
}

export default UpdateIaConfigDto;
