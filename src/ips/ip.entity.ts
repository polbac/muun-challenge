import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('ips')
export class Ip {
    @PrimaryGeneratedColumn()
    id: number;

    @Index('idx_ips_ip', { unique: true })
    @Column({ type: 'inet', unique: true })
    ip: string;

    @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
    created_at: Date;
}
