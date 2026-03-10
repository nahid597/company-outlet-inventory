import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Outlet } from './outlet.entity';
import { SaleItem } from './sale-item.entity';

@Entity('sales')
@Index(['outlet'])
@Index(['createdAt'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'outlet_id', type: 'uuid' })
  outletId!: string;

  /** Human-readable sequential receipt number, e.g. OUT01-20260311-0001 */
  @Column({ name: 'receipt_number', type: 'varchar', length: 60, unique: true })
  receiptNumber!: string;

  /** Immutable total captured at time of sale */
  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Outlet, (outlet) => outlet.sales, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'outlet_id' })
  outlet!: Outlet;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: ['insert'] })
  items!: SaleItem[];
}
