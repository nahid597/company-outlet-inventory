import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Company } from './company.entity';
import { OutletMenuItem } from './outlet-menu-item.entity';
import { OutletReceiptSequence } from './outlet-receipt-sequence.entity';
import { Sale } from './sale.entity';

@Entity('outlets')
@Index(['company'])
export class Outlet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Company, (company) => company.outlets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @OneToMany(() => OutletMenuItem, (omi) => omi.outlet)
  outletMenuItems!: OutletMenuItem[];

  @OneToMany(() => Sale, (sale) => sale.outlet)
  sales!: Sale[];

  @OneToMany(() => OutletReceiptSequence, (seq) => seq.outlet)
  receiptSequences!: OutletReceiptSequence[];
}
