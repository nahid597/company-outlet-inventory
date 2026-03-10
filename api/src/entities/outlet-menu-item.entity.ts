import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { MenuItem } from './menu-item.entity';
import { Outlet } from './outlet.entity';

@Entity('outlet_menu_items')
@Index(['outlet', 'menuItem'], { unique: true })
@Index(['outlet'])
@Index(['menuItem'])
export class OutletMenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'outlet_id', type: 'uuid' })
  outletId!: string;

  @Column({ name: 'menu_item_id', type: 'uuid' })
  menuItemId!: string;

  /**
   * When set, this price overrides menu_items.base_price for this outlet.
   */
  @Column({ name: 'override_price', type: 'numeric', precision: 12, scale: 2, nullable: true })
  overridePrice!: string | null;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Outlet, (outlet) => outlet.outletMenuItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outlet_id' })
  outlet!: Outlet;

  @ManyToOne(() => MenuItem, (item) => item.outletMenuItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem;
}
