import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EmpresaEntity } from '../../../empresas/infrastructure/entities/empresa.entity';
import { RolEntity } from '../../../roles/infrastructure/entities/rol.entity';

@Entity({ schema: 'freeler', name: 'usuarios_empresa' })
export class UsuarioEmpresaEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_usuario_empresa' })
  id_usuario_empresa!: number;

  @Column({ type: 'int', name: 'id_empresa', nullable: true })
  id_empresa?: number | null;

  @Column({ type: 'int', name: 'id_rol', nullable: true })
  id_rol?: number | null;

  @Column({ type: 'varchar', name: 'nombres', length: 255 })
  nombres!: string;

  @Column({ type: 'varchar', name: 'apellidos', length: 255 })
  apellidos!: string;

  @Column({ type: 'varchar', name: 'email', unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', name: 'password', length: 255 })
  password!: string;

  @Column({ type: 'int', name: 'estado', default: 1 })
  estado!: number;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion!: Date;

  @ManyToOne(() => EmpresaEntity, { nullable: true })
  @JoinColumn({ name: 'id_empresa', referencedColumnName: 'id_empresa' })
  empresa?: EmpresaEntity | null;

  @ManyToOne(() => RolEntity, { nullable: true })
  @JoinColumn({ name: 'id_rol', referencedColumnName: 'id_rol' })
  rol?: RolEntity | null;
}

export default UsuarioEmpresaEntity;
