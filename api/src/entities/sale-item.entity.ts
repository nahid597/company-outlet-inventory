import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { OutletMenuItem } from './outlet-menu-item.entity';
import { Sale } from './sale.entity';

@Entity('sale_items')
@Index(['sale'])
@Index(['outletMenuItem'])
@Check('"quantity" > 0')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId!: string;

  @Column({ name: 'outlet_menu_item_id', type: 'uuid' })
  outletMenuItemId!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  /** Unit price captured at time of sale */
  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  /** quantity × unit_price, captured at time of sale */
  @Column({ name: 'subtotal', type: 'numeric', precision: 14, scale: 2 })
  subtotal!: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @ManyToOne(() => OutletMenuItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'outlet_menu_item_id' })
  outletMenuItem!: OutletMenuItem;
}
