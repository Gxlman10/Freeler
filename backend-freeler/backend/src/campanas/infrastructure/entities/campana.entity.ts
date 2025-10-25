import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmpresaEntity } from '../../../empresas/infrastructure/entities/empresa.entity';
import { LeadEntity } from '../../../leads/infrastructure/entities/lead.entity';

@Entity({ schema: 'freeler', name: 'campanias' })
export class CampanaEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id_campania' })
  id_campania!: number;

  @Column({ type: 'int', name: 'id_empresa', nullable: true })
  id_empresa?: number | null;

  @Column({ type: 'varchar', length: 255, name: 'nombre' })
  nombre!: string;

  @Column({ type: 'text', name: 'descripcion', nullable: true })
  descripcion?: string | null;

  @Column({ type: 'varchar', length: 255, name: 'ubicacion', nullable: true })
  ubicacion?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'comision' })
  comision!: string; // numeric se maneja como string en TypeORM para evitar pérdida de precisión

  @Column({ type: 'date', name: 'fecha_inicio' })
  fecha_inicio!: string;

  @Column({ type: 'date', name: 'fecha_fin' })
  fecha_fin!: string;

  @Column({ type: 'int', name: 'estado', default: 1 })
  estado!: number;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'fecha_creacion',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_creacion!: Date;

  @ManyToOne(() => EmpresaEntity, { nullable: true })
  @JoinColumn({ name: 'id_empresa', referencedColumnName: 'id_empresa' })
  empresa?: EmpresaEntity | null;

  @OneToMany(() => LeadEntity, (lead) => lead.campania)
  leads?: LeadEntity[];

  totalReferidos?: number;
}

export default CampanaEntity;
