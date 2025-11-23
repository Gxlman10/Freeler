import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  COMISION_REPOSITORY,
  IComisionRepository,
} from '../interfaces/comision.repository.interface';
import { ComisionRetiroEntity } from '../../infrastructure/entities/comision-retiro.entity';
import RequestCommissionPayoutDto from '../../infrastructure/dto/request-commission-payout.dto';
import { COMISION_ESTADO_SOLICITADA } from '../services/commission-accounting.service';

@Injectable()
export class RequestCommissionPayoutUseCase {
  constructor(
    @Inject(COMISION_REPOSITORY)
    private readonly comisiones: IComisionRepository,
    @InjectRepository(ComisionRetiroEntity)
    private readonly retiroRepo: Repository<ComisionRetiroEntity>,
  ) {}

  async execute(
    comisionId: number,
    usuarioFreelerId: number,
    dto: RequestCommissionPayoutDto,
  ) {
    const comision = await this.comisiones.findById(comisionId);
    if (!comision) throw new NotFoundException('COMISION_NOT_FOUND');
    if (!comision.id_usuario_freeler) {
      throw new BadRequestException('COMISION_SIN_REFERENTE');
    }
    if (comision.id_usuario_freeler !== usuarioFreelerId) {
      throw new ForbiddenException('COMISION_NOT_OWNED');
    }
    if (Number(comision.id_estado_comision) === COMISION_ESTADO_SOLICITADA) {
      throw new BadRequestException('COMISION_YA_SOLICITADA');
    }
    if (Number(comision.id_estado_comision) === 3) {
      throw new BadRequestException('COMISION_YA_PAGADA');
    }

    const existingPending = await this.retiroRepo.findOne({
      where: {
        id_comision: comisionId,
        estado: 'pendiente',
      },
    });
    if (existingPending) {
      throw new BadRequestException('RETIRO_PENDIENTE_EN_PROCESO');
    }

    const detalles =
      dto.metodo_pago === 'yape'
        ? {
            telefono: dto.telefono_yape,
            nombres: dto.nombres_yape,
          }
        : {
            cci: dto.cci,
            titular: dto.titular,
            banco: dto.banco,
          };

    if (dto.metodo_pago === 'yape') {
      if (!dto.telefono_yape || !dto.nombres_yape) {
        throw new BadRequestException('YAPE_DATA_INCOMPLETE');
      }
    } else if (dto.metodo_pago === 'transferencia') {
      if (!dto.cci || !dto.titular || !dto.banco) {
        throw new BadRequestException('TRANSFERENCIA_DATA_INCOMPLETE');
      }
    }

    const request = this.retiroRepo.create({
      id_comision: comisionId,
      id_usuario_freeler: usuarioFreelerId,
      monto: comision.monto,
      metodo_pago: dto.metodo_pago,
      detalles,
      estado: 'pendiente',
    });
    const saved = await this.retiroRepo.save(request);
    await this.comisiones.update(comisionId, {
      id_estado_comision: COMISION_ESTADO_SOLICITADA,
    });
    return saved;
  }
}

export default RequestCommissionPayoutUseCase;
