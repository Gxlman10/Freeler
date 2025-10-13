import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'freeler', name: 'estado_lead' })
export class EstadoLeadEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_estado_lead' })
  id_estado_lead!: number;

  @Column({ type: 'varchar', length: 255, name: 'nombre' })
  nombre!: string;

  @Column({ type: 'text', name: 'descripcion', nullable: true })
  descripcion?: string | null;
}

export default EstadoLeadEntity;
