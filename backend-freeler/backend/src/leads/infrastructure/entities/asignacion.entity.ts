import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LeadEntity } from './lead.entity';
import { UsuarioEmpresaEntity } from '../../../usuarios-empresa/infrastructure/entities/usuario-empresa.entity';

@Entity({ schema: 'freeler', name: 'asignaciones' })
export class AsignacionEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_asignacion' })
  id_asignacion!: number;

  @Column({ type: 'int', name: 'id_lead', nullable: false })
  id_lead!: number;

  @Column({ type: 'int', name: 'id_usuario_empresa', nullable: false })
  id_usuario_empresa!: number;

  @Column({
    type: 'int',
    name: 'id_asignado_usuario_empresa',
    nullable: false,
  })
  id_asignado_usuario_empresa!: number;

  @Column({ type: 'int', name: 'id_estado_lead', nullable: false })
  id_estado_lead!: number;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_asignacion',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_asignacion!: Date;

  // 1 = activo, 0 = inactivo
  @Column({ type: 'int', name: 'estado', default: 1 })
  estado!: number;

  @ManyToOne(() => LeadEntity, { nullable: true })
  @JoinColumn({ name: 'id_lead', referencedColumnName: 'id_lead' })
  lead?: LeadEntity | null;

  @ManyToOne(() => UsuarioEmpresaEntity, { nullable: true })
  @JoinColumn({
    name: 'id_usuario_empresa',
    referencedColumnName: 'id_usuario_empresa',
  })
  actor?: UsuarioEmpresaEntity | null;

  @ManyToOne(() => UsuarioEmpresaEntity, { nullable: true })
  @JoinColumn({
    name: 'id_asignado_usuario_empresa',
    referencedColumnName: 'id_usuario_empresa',
  })
  asignado?: UsuarioEmpresaEntity | null;
}

export default AsignacionEntity;
