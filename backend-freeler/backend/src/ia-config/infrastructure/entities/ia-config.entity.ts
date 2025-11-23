import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'freeler', name: 'ia_config' })
export class IaConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'api_key', type: 'text', nullable: true })
  apiKey?: string | null;

  @Column({ name: 'provider', type: 'varchar', length: 50, default: 'openai' })
  provider!: string;

  @Column({ name: 'model', type: 'varchar', length: 120, default: 'gpt-3.5-turbo' })
  model!: string;

  @Column({ name: 'base_prompt', type: 'text' })
  basePrompt!: string;

  @Column({ name: 'temperature', type: 'numeric', precision: 4, scale: 2, default: 0.35 })
  temperature!: number;

  @Column({ name: 'guidance', type: 'numeric', precision: 4, scale: 2, default: 0.60 })
  guidance!: number;

  @Column({ name: 'max_tokens', type: 'int', default: 600 })
  maxTokens!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}

export default IaConfigEntity;
