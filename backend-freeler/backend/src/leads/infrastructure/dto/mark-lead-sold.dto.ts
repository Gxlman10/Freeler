import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class MarkLeadSoldDto {
  @ApiProperty({
    example: 1,
    description: 'ID del lead (se marcará como ganado)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadId!: number;

  @ApiProperty({
    example: 100,
    description: 'Actor: usuario empresa que marca vendido',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioEmpresaId!: number;
}

export default MarkLeadSoldDto;
