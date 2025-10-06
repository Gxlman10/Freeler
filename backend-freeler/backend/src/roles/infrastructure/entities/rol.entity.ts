import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'freeler', name: 'roles' })
export class RolEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_rol' })
  id_rol!: number;

  @Column({ type: 'varchar', length: 255, name: 'nombre' })
  nombre!: string;

  @Column({ type: 'text', name: 'descripcion', nullable: true })
  descripcion?: string | null;
}

export default RolEntity;
