import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LeadEntity } from '../../../leads/infrastructure/entities/lead.entity';
import { CampanaEntity } from '../../../campanas/infrastructure/entities/campana.entity';
import { UsuarioFreelerEntity } from '../../../usuarios-freeler/infrastructure/entities/usuario-freeler.entity';
import { EstadoComisionEntity } from './estado-comision.entity';
import { ComisionSolicitudEntity } from './comision-solicitud.entity';

@Entity({ schema: 'freeler', name: 'comisiones' })
export class ComisionEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_comision' })
  id_comision!: number;

  @Column({ type: 'int', name: 'id_lead', nullable: true })
  id_lead?: number | null;

  @Column({ type: 'int', name: 'id_usuario_freeler', nullable: true })
  id_usuario_freeler?: number | null;

  @Column({ type: 'int', name: 'id_campania', nullable: true })
  id_campania?: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'monto' })
  monto!: string;

  @Column({ type: 'int', name: 'id_estado_comision', nullable: true })
  id_estado_comision?: number | null;

  @Column({ type: 'int', name: 'id_solicitud', nullable: true })
  id_solicitud?: number | null;

  @Column({ type: 'timestamp', name: 'fecha_pago', nullable: true })
  fecha_pago?: Date | null;

  @ManyToOne(() => LeadEntity, { nullable: true })
  @JoinColumn({ name: 'id_lead', referencedColumnName: 'id_lead' })
  lead?: LeadEntity | null;

  @ManyToOne(() => UsuarioFreelerEntity, { nullable: true })
  @JoinColumn({
    name: 'id_usuario_freeler',
    referencedColumnName: 'id_usuario_freeler',
  })
  freeler?: UsuarioFreelerEntity | null;

  @ManyToOne(() => CampanaEntity, { nullable: true })
  @JoinColumn({ name: 'id_campania', referencedColumnName: 'id_campania' })
  campania?: CampanaEntity | null;

  @ManyToOne(() => EstadoComisionEntity, { nullable: true })
  @JoinColumn({
    name: 'id_estado_comision',
    referencedColumnName: 'id_estado_comision',
  })
  estado?: EstadoComisionEntity | null;

  @OneToMany(() => ComisionSolicitudEntity, (solicitud) => solicitud.comision, {
    cascade: false,
  })
  solicitudes?: ComisionSolicitudEntity[];
}

export default ComisionEntity;
