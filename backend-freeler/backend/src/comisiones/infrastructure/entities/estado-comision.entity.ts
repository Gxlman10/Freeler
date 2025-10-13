import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'freeler', name: 'estado_comisiones' })
export class EstadoComisionEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_estado_comision' })
  id_estado_comision!: number;

  @Column({ type: 'varchar', length: 255, name: 'nombre' })
  nombre!: string;

  @Column({ type: 'text', name: 'descripcion', nullable: true })
  descripcion?: string | null;
}

export default EstadoComisionEntity;
