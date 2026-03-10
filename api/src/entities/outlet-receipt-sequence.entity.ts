import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Outlet } from './outlet.entity';

/**
 * One row per outlet. Holds the last issued sequential number.
 * Row is locked with SELECT ... FOR UPDATE before each new receipt
 * to guarantee monotonic uniqueness under concurrent requests.
 */
@Entity('outlet_receipt_sequences')
@Index(['outlet'], { unique: true })
export class OutletReceiptSequence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'outlet_id', type: 'uuid', unique: true })
  outletId!: string;

  @Column({ name: 'last_sequence', type: 'integer', default: 0 })
  lastSequence!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Outlet, (outlet) => outlet.receiptSequences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outlet_id' })
  outlet!: Outlet;
}
