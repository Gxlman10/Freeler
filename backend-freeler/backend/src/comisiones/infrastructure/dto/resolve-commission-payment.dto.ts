import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class ResolveCommissionPaymentDto {
  @ApiPropertyOptional({
    enum: ['pagado', 'pendiente'],
    default: 'pagado',
    description: 'Estado final de la comisión tras la revisión',
  })
  @IsOptional()
  @IsEnum(['pagado', 'pendiente'])
  estado?: 'pagado' | 'pendiente';
}

export default ResolveCommissionPaymentDto;
