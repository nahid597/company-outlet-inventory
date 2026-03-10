import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OutletMenuItem } from './outlet-menu-item.entity';

@Entity('outlet_inventory')
@Index(['outletMenuItem'], { unique: true })
@Check('"quantity" >= 0')
export class OutletInventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'outlet_menu_item_id', type: 'uuid', unique: true })
  outletMenuItemId!: string;

  @Column({ type: 'integer', default: 0 })
  quantity!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => OutletMenuItem, (omi) => omi.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outlet_menu_item_id' })
  outletMenuItem!: OutletMenuItem;
}
