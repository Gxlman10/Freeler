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

  @Column({ type: 'int', name: 'id_lead', nullable: true })
  id_lead?: number | null;

  @Column({ type: 'int', name: 'id_usuario_empresa', nullable: true })
  id_usuario_empresa?: number | null;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_asignacion',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_asignacion!: Date;

  @Column({ type: 'varchar', length: 50, name: 'estado', default: 'activo' })
  estado!: string;

  @ManyToOne(() => LeadEntity, { nullable: true })
  @JoinColumn({ name: 'id_lead', referencedColumnName: 'id_lead' })
  lead?: LeadEntity | null;

  @ManyToOne(() => UsuarioEmpresaEntity, { nullable: true })
  @JoinColumn({
    name: 'id_usuario_empresa',
    referencedColumnName: 'id_usuario_empresa',
  })
  usuarioEmpresa?: UsuarioEmpresaEntity | null;
}

export default AsignacionEntity;
