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

@Entity({ schema: 'freeler', name: 'comision_retiros' })
export class ComisionRetiroEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_retiro' })
  id_retiro!: number;

  @Column({ type: 'int', name: 'id_comision' })
  id_comision!: number;

  @Column({ type: 'int', name: 'id_usuario_freeler' })
  id_usuario_freeler!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'monto' })
  monto!: string;

  @Column({ type: 'varchar', length: 20, name: 'metodo_pago' })
  metodo_pago!: 'yape' | 'transferencia';

  @Column({ type: 'jsonb', name: 'detalles', nullable: true })
  detalles?: Record<string, string> | null;

  @Column({ type: 'varchar', length: 20, name: 'estado', default: 'pendiente' })
  estado!: 'pendiente' | 'pagado' | 'cancelado';

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_solicitud',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_solicitud!: Date;

  @Column({ type: 'timestamp', name: 'fecha_resolucion', nullable: true })
  fecha_resolucion?: Date | null;

  @ManyToOne(() => ComisionEntity, { nullable: false })
  @JoinColumn({ name: 'id_comision', referencedColumnName: 'id_comision' })
  comision?: ComisionEntity;

  @ManyToOne(() => UsuarioFreelerEntity, { nullable: false })
  @JoinColumn({
    name: 'id_usuario_freeler',
    referencedColumnName: 'id_usuario_freeler',
  })
  freeler?: UsuarioFreelerEntity;
}

export default ComisionRetiroEntity;
