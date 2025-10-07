import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsInt, Min } from 'class-validator';
import { CreateCampanaDto } from './create-campana.dto';

export class UpdateCampanaDto extends PartialType(CreateCampanaDto) {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario empresa que ejecuta la acción',
  })
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioEmpresaId!: number;
}

export default UpdateCampanaDto;
