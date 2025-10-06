import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'freeler', name: 'empresas' })
export class EmpresaEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_empresa' })
  id_empresa!: number;

  @Column({ type: 'varchar', length: 255, name: 'razon_social' })
  razon_social!: string;

  @Column({ type: 'varchar', length: 255, name: 'ruc' })
  ruc!: string;

  @Column({ type: 'varchar', length: 255, name: 'direccion', nullable: true })
  direccion?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'telefono', nullable: true })
  telefono?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'email', nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'representante_legal', nullable: true })
  representante_legal?: string | null;

  @Column({ type: 'int', name: 'estado', default: 1 })
  estado!: number;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion!: Date;
}

export default EmpresaEntity;
