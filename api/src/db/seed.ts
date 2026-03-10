/**
 * Seed script – idempotent (uses INSERT ... ON CONFLICT DO NOTHING).
 * Run with:  npx ts-node src/db/seed.ts
 */
import 'reflect-metadata';

import { AppDataSource } from './data-source';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const OUTLET_IDS = [
  '00000000-0000-0000-0001-000000000001', // Outlet A
  '00000000-0000-0000-0001-000000000002', // Outlet B
  '00000000-0000-0000-0001-000000000003', // Outlet C
];
const MENU_ITEM_IDS = [
  '00000000-0000-0000-0002-000000000001', // Nasi Lemak
  '00000000-0000-0000-0002-000000000002', // Teh Tarik
  '00000000-0000-0000-0002-000000000003', // Roti Canai
  '00000000-0000-0000-0002-000000000004', // Mee Goreng
  '00000000-0000-0000-0002-000000000005', // Kopi O
];

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  const query = AppDataSource.query.bind(AppDataSource);

  console.log('🌱  Seeding company …');
  await query(
    `INSERT INTO companies (id, name, code) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    [COMPANY_ID, 'Demo F&B Group', 'DEMO'],
  );

  console.log('🌱  Seeding outlets …');
  const outlets = [
    { id: OUTLET_IDS[0], name: 'Outlet A – City Centre', code: 'OUT-A' },
    { id: OUTLET_IDS[1], name: 'Outlet B – Suburb Mall', code: 'OUT-B' },
    { id: OUTLET_IDS[2], name: 'Outlet C – Airport', code: 'OUT-C' },
  ];
  for (const o of outlets) {
    await query(
      `INSERT INTO outlets (id, company_id, name, code) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [o.id, COMPANY_ID, o.name, o.code],
    );
  }

  console.log('🌱  Seeding menu items …');
  const menuItems = [
    { id: MENU_ITEM_IDS[0], name: 'Nasi Lemak',  category: 'Main',     price: '12.00' },
    { id: MENU_ITEM_IDS[1], name: 'Teh Tarik',   category: 'Beverage', price: '3.50' },
    { id: MENU_ITEM_IDS[2], name: 'Roti Canai',  category: 'Main',     price: '5.00' },
    { id: MENU_ITEM_IDS[3], name: 'Mee Goreng',  category: 'Main',     price: '10.00' },
    { id: MENU_ITEM_IDS[4], name: 'Kopi O',      category: 'Beverage', price: '3.00' },
  ];
  for (const m of menuItems) {
    await query(
      `INSERT INTO menu_items (id, name, category, base_price) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.name, m.category, m.price],
    );
  }

  console.log('🌱  Assigning menu items to outlets …');
  // All items → Outlet A (no price override)
  // Items 0-2 → Outlet B with a price override on item 0
  // Items 0 & 1 → Outlet C
  const assignments: Array<{ outlet: string; item: string; override: string | null }> = [
    ...MENU_ITEM_IDS.map((id) => ({ outlet: OUTLET_IDS[0], item: id, override: null })),
    { outlet: OUTLET_IDS[1], item: MENU_ITEM_IDS[0], override: '13.00' }, // Nasi Lemak slightly higher
    { outlet: OUTLET_IDS[1], item: MENU_ITEM_IDS[1], override: null },
    { outlet: OUTLET_IDS[1], item: MENU_ITEM_IDS[2], override: null },
    { outlet: OUTLET_IDS[2], item: MENU_ITEM_IDS[0], override: null },
    { outlet: OUTLET_IDS[2], item: MENU_ITEM_IDS[1], override: null },
  ];

  const omiIds: Record<string, string> = {}; // "outletId:menuItemId" → omi.id

  for (const a of assignments) {
    const rows: Array<{ id: string }> = await query(
      `INSERT INTO outlet_menu_items (outlet_id, menu_item_id, override_price)
       VALUES ($1, $2, $3)
       ON CONFLICT (outlet_id, menu_item_id) DO UPDATE SET override_price = EXCLUDED.override_price
       RETURNING id`,
      [a.outlet, a.item, a.override],
    );
    if (rows[0]) {
      omiIds[`${a.outlet}:${a.item}`] = rows[0].id;
    }
  }

  console.log('🌱  Seeding inventory (50 units each) …');
  for (const [key, omiId] of Object.entries(omiIds)) {
    await query(
      `INSERT INTO outlet_inventory (outlet_menu_item_id, quantity)
       VALUES ($1, 50)
       ON CONFLICT (outlet_menu_item_id) DO NOTHING`,
      [omiId],
    );
    void key;
  }

  console.log('🌱  Seeding receipt sequences …');
  for (const outletId of OUTLET_IDS) {
    await query(
      `INSERT INTO outlet_receipt_sequences (outlet_id, last_sequence)
       VALUES ($1, 0)
       ON CONFLICT (outlet_id) DO NOTHING`,
      [outletId],
    );
  }

  console.log('✅  Seed complete.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
