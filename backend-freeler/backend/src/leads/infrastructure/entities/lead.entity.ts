import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CampanaEntity } from '../../../campanas/infrastructure/entities/campana.entity';
import { UsuarioFreelerEntity } from '../../../usuarios-freeler/infrastructure/entities/usuario-freeler.entity';
import { EstadoLeadEntity } from './estado-lead.entity';

@Entity({ schema: 'freeler', name: 'leads' })
export class LeadEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_lead' })
  id_lead!: number;

  @Column({ type: 'int', name: 'id_campania', nullable: true })
  id_campania?: number | null;

  @Column({ type: 'int', name: 'id_usuario_freeler', nullable: true })
  id_usuario_freeler?: number | null;

  @Column({ type: 'varchar', length: 255, name: 'nombres' })
  nombres!: string;

  @Column({ type: 'varchar', length: 255, name: 'apellidos' })
  apellidos!: string;

  @Column({ type: 'varchar', length: 255, name: 'dni', nullable: true })
  dni?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'email', nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'telefono', nullable: true })
  telefono?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'ocupacion', nullable: true })
  ocupacion?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'ciudad', nullable: true })
  ciudad?: string | null;

  @Column({ type: 'text', name: 'descripcion', nullable: true })
  descripcion?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'origen' })
  origen!: string;

  @Column({ type: 'int', name: 'id_estado_lead', nullable: true })
  id_estado_lead?: number | null;

  @Column({ type: 'boolean', name: 'estado_completo', default: false })
  estado_completo!: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_creacion',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_creacion!: Date;

  @ManyToOne(() => CampanaEntity, { nullable: true })
  @JoinColumn({ name: 'id_campania', referencedColumnName: 'id_campania' })
  campania?: CampanaEntity | null;

  @ManyToOne(() => UsuarioFreelerEntity, { nullable: true })
  @JoinColumn({
    name: 'id_usuario_freeler',
    referencedColumnName: 'id_usuario_freeler',
  })
  freeler?: UsuarioFreelerEntity | null;

  @ManyToOne(() => EstadoLeadEntity, { nullable: true })
  @JoinColumn({
    name: 'id_estado_lead',
    referencedColumnName: 'id_estado_lead',
  })
  estado?: EstadoLeadEntity | null;
}

export default LeadEntity;
