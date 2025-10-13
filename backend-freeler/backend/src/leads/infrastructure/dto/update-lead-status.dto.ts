import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateLeadStatusDto {
  @ApiProperty({ example: 1, description: 'ID del lead' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  leadId!: number;

  @ApiProperty({
    example: 2,
    description: 'Nuevo estado: 1 En Gestión, 2 Ganado, 3 Perdido',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_estado_lead!: number;

  @ApiProperty({
    example: 100,
    description: 'Actor: usuario empresa que cambia el estado',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioEmpresaId!: number;
}

export default UpdateLeadStatusDto;
