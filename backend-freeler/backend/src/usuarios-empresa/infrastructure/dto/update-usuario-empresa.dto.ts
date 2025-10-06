import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioEmpresaDto } from './create-usuario-empresa.dto';

export class UpdateUsuarioEmpresaDto extends PartialType(CreateUsuarioEmpresaDto) {}

export default UpdateUsuarioEmpresaDto;
