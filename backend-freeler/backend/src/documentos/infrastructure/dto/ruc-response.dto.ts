import { ApiProperty } from '@nestjs/swagger';

export class RucResponseDto {
  @ApiProperty({ example: '20131312955' })
  ruc!: string;

  @ApiProperty({
    example:
      'SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA - SUNAT',
    nullable: true,
  })
  razonSocial!: string | null;

  @ApiProperty({ example: 'SUNAT', nullable: true })
  nombreComercial!: string | null;

  @ApiProperty({ example: 'ACTIVO', nullable: true })
  estado!: string | null;

  @ApiProperty({ example: 'HABIDO', nullable: true })
  condicion!: string | null;

  @ApiProperty({
    example: 'AV. GARCILASO DE LA VEGA NRO. 1472 LIMA LIMA LIMA',
    nullable: true,
  })
  direccion!: string | null;

  @ApiProperty({ example: 'LIMA', nullable: true })
  departamento!: string | null;

  @ApiProperty({ example: 'LIMA', nullable: true })
  provincia!: string | null;

  @ApiProperty({ example: 'LIMA', nullable: true })
  distrito!: string | null;

  @ApiProperty({ example: ['(01) 315-0730'], nullable: true })
  telefonos!: string[];

  @ApiProperty({ example: '150101', nullable: true })
  ubigeo!: string | null;

  @ApiProperty({ example: 'LIMA', nullable: true })
  capital!: string | null;
}

export default RucResponseDto;
