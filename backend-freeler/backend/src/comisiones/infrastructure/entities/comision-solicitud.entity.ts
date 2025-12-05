import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComisionEntity } from './comision.entity';
import { UsuarioFreelerEntity } from '../../../usuarios-freeler/infrastructure/entities/usuario-freeler.entity';
import { UsuarioEmpresaEntity } from '../../../usuarios-empresa/infrastructure/entities/usuario-empresa.entity';

@Entity({ schema: 'freeler', name: 'comision_solicitudes' })
export class ComisionSolicitudEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_solicitud' })
  id_solicitud!: number;

  @Column({ type: 'int', name: 'id_comision' })
  id_comision!: number;

  @Column({ type: 'int', name: 'id_usuario_freeler' })
  id_usuario_freeler!: number;

  @Column({ type: 'varchar', length: 20, name: 'metodo_pago' })
  metodo_pago!: 'yape' | 'transferencia' | 'plin';

  @Column({ type: 'jsonb', name: 'datos_pago', nullable: true })
  datos_pago?: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, name: 'estado', default: 'pendiente' })
  estado!: 'pendiente' | 'pagada' | 'rechazada';

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_solicitud',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_solicitud!: Date;

  @Column({ type: 'timestamp', name: 'fecha_resolucion', nullable: true })
  fecha_resolucion?: Date | null;

  @Column({ type: 'int', name: 'aprobado_por', nullable: true })
  aprobado_por?: number | null;

  @Column({ type: 'text', name: 'notas_admin', nullable: true })
  notas_admin?: string | null;

  @ManyToOne(() => ComisionEntity, (comision) => comision.solicitudes, { nullable: false })
  @JoinColumn({ name: 'id_comision', referencedColumnName: 'id_comision' })
  comision?: ComisionEntity;

  @ManyToOne(() => UsuarioFreelerEntity, { nullable: false })
  @JoinColumn({
    name: 'id_usuario_freeler',
    referencedColumnName: 'id_usuario_freeler',
  })
  freeler?: UsuarioFreelerEntity;

  @ManyToOne(() => UsuarioEmpresaEntity, { nullable: true })
  @JoinColumn({
    name: 'aprobado_por',
    referencedColumnName: 'id_usuario_empresa',
  })
  aprobadoPorUsuario?: UsuarioEmpresaEntity | null;
}

export default ComisionSolicitudEntity;
