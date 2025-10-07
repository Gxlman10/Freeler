import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioFreelerDto } from './create-usuario-freeler.dto';

export class UpdateUsuarioFreelerDto extends PartialType(
  CreateUsuarioFreelerDto,
) {}
