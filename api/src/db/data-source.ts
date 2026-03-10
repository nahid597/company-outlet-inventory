import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { Company } from '../entities/company.entity';
import { MenuItem } from '../entities/menu-item.entity';
import { OutletInventory } from '../entities/outlet-inventory.entity';
import { OutletMenuItem } from '../entities/outlet-menu-item.entity';
import { OutletReceiptSequence } from '../entities/outlet-receipt-sequence.entity';
import { Outlet } from '../entities/outlet.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Sale } from '../entities/sale.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [Company, MenuItem, Outlet, OutletInventory, OutletMenuItem, OutletReceiptSequence, Sale, SaleItem],
  migrations: ['src/db/migrations/*.ts', 'dist/db/migrations/*.js'],
  synchronize: false,
  logging: env.NODE_ENV === 'development',
  ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
