import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class RequestCommissionPayoutDto {
  @ApiProperty({
    enum: ['yape', 'transferencia'],
    description: 'Medio de pago elegido por el usuario',
  })
  @IsEnum(['yape', 'transferencia'])
  metodo_pago!: 'yape' | 'transferencia';

  @ApiProperty({
    required: false,
    description: 'Telefono asociado a Yape (solo si metodo es yape)',
  })
  @IsOptional()
  @IsString()
  @Length(6, 15)
  telefono_yape?: string;

  @ApiProperty({
    required: false,
    description: 'Nombre del titular en Yape',
  })
  @IsOptional()
  @IsString()
  @Length(3, 255)
  nombres_yape?: string;

  @ApiProperty({
    required: false,
    description: 'Codigo CCI (solo transferencia)',
  })
  @IsOptional()
  @IsString()
  @Length(15, 24)
  cci?: string;

  @ApiProperty({
    required: false,
    description: 'Nombre del titular de la cuenta',
  })
  @IsOptional()
  @IsString()
  @Length(3, 255)
  titular?: string;

  @ApiProperty({
    required: false,
    description: 'Banco destino',
  })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  banco?: string;

  @ApiProperty({
    required: false,
    description: 'Notas adicionales',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notas?: string;

  @ApiProperty({
    required: false,
    description: 'Lista opcional de IDs de comisiones a solicitar',
    type: [Number],
  })
  @IsOptional()
  commissionIds?: number[];
}

export default RequestCommissionPayoutDto;
