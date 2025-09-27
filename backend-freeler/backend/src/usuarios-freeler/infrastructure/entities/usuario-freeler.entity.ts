import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'freeler', name: 'usuario_freeler' })
export class UsuarioFreelerEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_usuario_freeler' })
  id_usuario_freeler!: number;

  @Column({ type: 'varchar', name: 'nombres', length: 255 })
  nombres!: string;

  @Column({ type: 'varchar', name: 'apellidos', length: 255 })
  apellidos!: string;

  @Column({ type: 'varchar', name: 'dni', unique: true, length: 255 })
  dni!: string;

  @Column({ type: 'varchar', name: 'email', unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', name: 'telefono', nullable: true, length: 255 })
  telefono?: string | null;

  @Column({ type: 'varchar', name: 'password', length: 255 })
  password!: string;

  @Column({ type: 'numeric', name: 'saldo', precision: 10, scale: 2, default: 0 })
  saldo!: string; // TypeORM devuelve numeric como string por precisión

  @Column({ type: 'int', name: 'estado', default: 1 })
  estado!: number;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion!: Date;
}
