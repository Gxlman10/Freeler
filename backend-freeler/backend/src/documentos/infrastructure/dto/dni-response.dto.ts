import { ApiProperty } from '@nestjs/swagger';

export class DniResponseDto {
  @ApiProperty({ example: '70030684' })
  dni!: string;

  @ApiProperty({ example: 'MARVIN PAUL', nullable: true })
  nombres!: string | null;

  @ApiProperty({ example: 'CORDOVA', nullable: true })
  apellidoPaterno!: string | null;

  @ApiProperty({ example: 'FLORES', nullable: true })
  apellidoMaterno!: string | null;

  @ApiProperty({ example: 'D', nullable: true })
  verificador?: string | null;
}

export default DniResponseDto;
