import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SelfAssignLeadDto {
  @ApiProperty({ example: 1, description: 'ID del lead' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadId!: number;

  @ApiProperty({
    example: 100,
    description: 'Actor: usuario empresa que se autoasigna',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioEmpresaId!: number;
}

export default SelfAssignLeadDto;
