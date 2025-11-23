import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsString()
  @Length(1, 2000)
  content!: string;
}

export class ChatRequestDto {
  @ApiProperty({ description: 'Pregunta o consulta principal del usuario' })
  @IsString()
  @Length(1, 2000)
  message!: string;

  @ApiPropertyOptional({
    type: [ChatMessageDto],
    description: 'Historial breve para mantener el contexto',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}

export default ChatRequestDto;
