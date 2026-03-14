import { Client } from "pg";

const TEST_DB_NAME = "management_system_phase4_test";
const COMPANY_ID = "10000000-0000-0000-0000-000000000001";
const OUTLET_ID = "10000000-0000-0000-0001-000000000001";
const MENU_ITEM_MAIN_ID = "10000000-0000-0000-0002-000000000001";
const MENU_ITEM_DRINK_ID = "10000000-0000-0000-0002-000000000002";
const OMI_MAIN_ID = "10000000-0000-0000-0003-000000000001";
const OMI_DRINK_ID = "10000000-0000-0000-0003-000000000002";

let appDataSource: any;
let saleService: any;

const createAdminClient = () =>
  new Client({
    host: "127.0.0.1",
    port: 5433,
    user: "postgres",
    password: "postgres",
    database: "postgres",
  });

const seedBaseData = async (): Promise<void> => {
  await appDataSource.query(
    `INSERT INTO companies (id, name, code) VALUES ($1, $2, $3)`,
    [COMPANY_ID, "Phase 4 Test Group", "TEST"],
  );

  await appDataSource.query(
    `INSERT INTO outlets (id, company_id, name, code) VALUES ($1, $2, $3, $4)`,
    [OUTLET_ID, COMPANY_ID, "Test Outlet", "OUT-A"],
  );

  await appDataSource.query(
    `INSERT INTO menu_items (id, name, category, base_price, is_active)
     VALUES ($1, $2, $3, $4, true), ($5, $6, $7, $8, true)`,
    [
      MENU_ITEM_MAIN_ID,
      "Nasi Lemak",
      "Main",
      "12.00",
      MENU_ITEM_DRINK_ID,
      "Teh Tarik",
      "Beverage",
      "3.50",
    ],
  );

  await appDataSource.query(
    `INSERT INTO outlet_menu_items (id, outlet_id, menu_item_id, override_price, is_available)
     VALUES ($1, $2, $3, NULL, true), ($4, $2, $5, NULL, true)`,
    [
      OMI_MAIN_ID,
      OUTLET_ID,
      MENU_ITEM_MAIN_ID,
      OMI_DRINK_ID,
      MENU_ITEM_DRINK_ID,
    ],
  );

  await appDataSource.query(
    `INSERT INTO outlet_inventory (outlet_menu_item_id, quantity)
     VALUES ($1, 5), ($2, 5)`,
    [OMI_MAIN_ID, OMI_DRINK_ID],
  );

  await appDataSource.query(
    `INSERT INTO outlet_receipt_sequences (outlet_id, last_sequence)
     VALUES ($1, 0)`,
    [OUTLET_ID],
  );
};

const resetTransactionalState = async (): Promise<void> => {
  await appDataSource.query(
    `TRUNCATE TABLE sale_items, sales RESTART IDENTITY CASCADE`,
  );
  await appDataSource.query(
    `UPDATE outlet_inventory
     SET quantity = CASE outlet_menu_item_id
       WHEN $1 THEN 5
       WHEN $2 THEN 5
       ELSE quantity
     END`,
    [OMI_MAIN_ID, OMI_DRINK_ID],
  );
  await appDataSource.query(
    `UPDATE outlet_receipt_sequences SET last_sequence = 0 WHERE outlet_id = $1`,
    [OUTLET_ID],
  );
};

describe("SaleService", () => {
  beforeAll(async () => {
    const adminClient = createAdminClient();
    await adminClient.connect();
    await adminClient.query(
      `DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`,
    );
    await adminClient.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    await adminClient.end();

    process.env.NODE_ENV = "test";
    process.env.DB_HOST = "127.0.0.1";
    process.env.DB_PORT = "5433";
    process.env.DB_USER = "postgres";
    process.env.DB_PASSWORD = "postgres";
    process.env.DB_NAME = TEST_DB_NAME;
    process.env.DB_SSL = "false";

    jest.resetModules();

    const dataSourceModule = await import("../db/data-source");
    const saleServiceModule = await import("./sale.service");

    appDataSource = dataSourceModule.AppDataSource;
    saleService = new saleServiceModule.SaleService();

    await appDataSource.initialize();
    await appDataSource.runMigrations();
    await seedBaseData();
  });

  beforeEach(async () => {
    await resetTransactionalState();
  });

  afterAll(async () => {
    if (appDataSource?.isInitialized) {
      await appDataSource.destroy();
    }

    const adminClient = createAdminClient();
    await adminClient.connect();
    await adminClient.query(
      `DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`,
    );
    await adminClient.end();
  });

  it("creates a sale, deducts stock, and returns a receipt payload", async () => {
    const receipt = await saleService.createSale(OUTLET_ID, {
      items: [
        { outletMenuItemId: OMI_MAIN_ID, quantity: 2 },
        { outletMenuItemId: OMI_DRINK_ID, quantity: 1 },
      ],
    });

    expect(receipt.receiptNumber).toMatch(/^OUT-A-\d{8}-0001$/);
    expect(receipt.totalAmount).toBe("27.50");
    expect(receipt.items).toHaveLength(2);

    const inventoryRows = await appDataSource.query(
      `SELECT outlet_menu_item_id, quantity
       FROM outlet_inventory
       WHERE outlet_menu_item_id IN ($1, $2)
       ORDER BY outlet_menu_item_id ASC`,
      [OMI_DRINK_ID, OMI_MAIN_ID],
    );

    expect(inventoryRows).toEqual([
      { outlet_menu_item_id: OMI_MAIN_ID, quantity: 3 },
      { outlet_menu_item_id: OMI_DRINK_ID, quantity: 4 },
    ]);
  });

  it("rejects a sale when requested stock exceeds availability", async () => {
    await expect(
      saleService.createSale(OUTLET_ID, {
        items: [{ outletMenuItemId: OMI_MAIN_ID, quantity: 6 }],
      }),
    ).rejects.toThrow("Insufficient stock for Nasi Lemak");

    const [{ quantity }] = await appDataSource.query(
      `SELECT quantity FROM outlet_inventory WHERE outlet_menu_item_id = $1`,
      [OMI_MAIN_ID],
    );
    const [{ count }] = await appDataSource.query(
      `SELECT COUNT(*)::int AS count FROM sales`,
    );

    expect(quantity).toBe(5);
    expect(count).toBe(0);
  });

  it("issues unique sequential receipts under concurrent sales", async () => {
    const results = await Promise.all([
      saleService.createSale(OUTLET_ID, {
        items: [{ outletMenuItemId: OMI_MAIN_ID, quantity: 2 }],
      }),
      saleService.createSale(OUTLET_ID, {
        items: [{ outletMenuItemId: OMI_MAIN_ID, quantity: 2 }],
      }),
    ]);

    const receiptNumbers = results
      .map((result: { receiptNumber: string }) => result.receiptNumber)
      .sort();

    expect(receiptNumbers).toEqual([
      expect.stringMatching(/^OUT-A-\d{8}-0001$/),
      expect.stringMatching(/^OUT-A-\d{8}-0002$/),
    ]);

    const [{ quantity }] = await appDataSource.query(
      `SELECT quantity FROM outlet_inventory WHERE outlet_menu_item_id = $1`,
      [OMI_MAIN_ID],
    );
    const [{ count }] = await appDataSource.query(
      `SELECT COUNT(*)::int AS count FROM sales`,
    );

    expect(quantity).toBe(1);
    expect(count).toBe(2);
  });

  it("returns recent sales newest-first with deterministically ordered line items", async () => {
    const firstReceipt = await saleService.createSale(OUTLET_ID, {
      items: [{ outletMenuItemId: OMI_MAIN_ID, quantity: 1 }],
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    const secondReceipt = await saleService.createSale(OUTLET_ID, {
      items: [
        { outletMenuItemId: OMI_MAIN_ID, quantity: 1 },
        { outletMenuItemId: OMI_DRINK_ID, quantity: 2 },
      ],
    });

    const recentSales = await saleService.listRecentSales(OUTLET_ID);

    expect(recentSales.outlet).toEqual({
      id: OUTLET_ID,
      code: "OUT-A",
      name: "Test Outlet",
    });
    expect(recentSales.sales).toHaveLength(2);
    expect(recentSales.sales[0].receiptNumber).toBe(
      secondReceipt.receiptNumber,
    );
    expect(recentSales.sales[1].receiptNumber).toBe(firstReceipt.receiptNumber);
    expect(recentSales.sales[0].itemCount).toBe(3);
    expect(
      recentSales.sales[0].items.map(
        (item: { outletMenuItemId: string }) => item.outletMenuItemId,
      ),
    ).toEqual([OMI_MAIN_ID, OMI_DRINK_ID]);
    expect(
      recentSales.sales[0].items.map((item: { name: string }) => item.name),
    ).toEqual(["Nasi Lemak", "Teh Tarik"]);
  });
});
