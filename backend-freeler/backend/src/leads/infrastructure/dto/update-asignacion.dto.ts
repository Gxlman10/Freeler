import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class UpdateAsignacionDto {
  @ApiProperty({
    example: 100,
    description: 'Actor: usuario empresa que realiza el cambio',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioEmpresaId!: number;

  @ApiProperty({ example: 'inactivo', enum: ['activo', 'inactivo'] })
  @IsIn(['activo', 'inactivo'])
  estado!: 'activo' | 'inactivo';
}

export default UpdateAsignacionDto;
