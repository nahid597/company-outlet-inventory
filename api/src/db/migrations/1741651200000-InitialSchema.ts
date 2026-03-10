import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1741651200000 implements MigrationInterface {
  name = 'InitialSchema1741651200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ──────────────────────────────────────────────
    // companies
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "name"       VARCHAR(120) NOT NULL,
        "code"       VARCHAR(50)  NOT NULL,
        "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_companies_name" UNIQUE ("name"),
        CONSTRAINT "UQ_companies_code" UNIQUE ("code")
      )
    `);

    // ──────────────────────────────────────────────
    // outlets
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "outlets" (
        "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
        "company_id" UUID         NOT NULL,
        "name"       VARCHAR(120) NOT NULL,
        "code"       VARCHAR(20)  NOT NULL,
        "address"    VARCHAR(255),
        "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outlets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outlets_code" UNIQUE ("code"),
        CONSTRAINT "FK_outlets_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_outlets_company_id" ON "outlets" ("company_id")`);

    // ──────────────────────────────────────────────
    // menu_items  (master menu owned by HQ)
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id"          UUID           NOT NULL DEFAULT gen_random_uuid(),
        "name"        VARCHAR(150)   NOT NULL,
        "category"    VARCHAR(100),
        "base_price"  NUMERIC(12, 2) NOT NULL,
        "description" VARCHAR(500),
        "is_active"   BOOLEAN        NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_items" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_menu_items_base_price" CHECK ("base_price" >= 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_menu_items_is_active" ON "menu_items" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_items_category"  ON "menu_items" ("category")`);

    // ──────────────────────────────────────────────
    // outlet_menu_items  (assignment + price override)
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "outlet_menu_items" (
        "id"             UUID           NOT NULL DEFAULT gen_random_uuid(),
        "outlet_id"      UUID           NOT NULL,
        "menu_item_id"   UUID           NOT NULL,
        "override_price" NUMERIC(12, 2),
        "is_available"   BOOLEAN        NOT NULL DEFAULT true,
        "created_at"     TIMESTAMPTZ    NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outlet_menu_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outlet_menu_items_outlet_menu" UNIQUE ("outlet_id", "menu_item_id"),
        CONSTRAINT "CHK_outlet_menu_items_override_price" CHECK ("override_price" IS NULL OR "override_price" >= 0),
        CONSTRAINT "FK_outlet_menu_items_outlet" FOREIGN KEY ("outlet_id")
          REFERENCES "outlets" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_outlet_menu_items_menu_item" FOREIGN KEY ("menu_item_id")
          REFERENCES "menu_items" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_outlet_menu_items_outlet_id"    ON "outlet_menu_items" ("outlet_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_outlet_menu_items_menu_item_id" ON "outlet_menu_items" ("menu_item_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_outlet_menu_items_is_available" ON "outlet_menu_items" ("outlet_id", "is_available")`);

    // ──────────────────────────────────────────────
    // outlet_inventory
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "outlet_inventory" (
        "id"                  UUID    NOT NULL DEFAULT gen_random_uuid(),
        "outlet_menu_item_id" UUID    NOT NULL,
        "quantity"            INTEGER NOT NULL DEFAULT 0,
        "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outlet_inventory" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outlet_inventory_omi" UNIQUE ("outlet_menu_item_id"),
        CONSTRAINT "CHK_outlet_inventory_quantity" CHECK ("quantity" >= 0),
        CONSTRAINT "FK_outlet_inventory_omi" FOREIGN KEY ("outlet_menu_item_id")
          REFERENCES "outlet_menu_items" ("id") ON DELETE CASCADE
      )
    `);

    // ──────────────────────────────────────────────
    // outlet_receipt_sequences
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "outlet_receipt_sequences" (
        "id"            UUID    NOT NULL DEFAULT gen_random_uuid(),
        "outlet_id"     UUID    NOT NULL,
        "last_sequence" INTEGER NOT NULL DEFAULT 0,
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outlet_receipt_sequences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outlet_receipt_sequences_outlet" UNIQUE ("outlet_id"),
        CONSTRAINT "FK_outlet_receipt_sequences_outlet" FOREIGN KEY ("outlet_id")
          REFERENCES "outlets" ("id") ON DELETE CASCADE
      )
    `);

    // ──────────────────────────────────────────────
    // sales
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id"             UUID           NOT NULL DEFAULT gen_random_uuid(),
        "outlet_id"      UUID           NOT NULL,
        "receipt_number" VARCHAR(60)    NOT NULL,
        "total_amount"   NUMERIC(14, 2) NOT NULL,
        "created_at"     TIMESTAMPTZ    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sales_receipt_number" UNIQUE ("receipt_number"),
        CONSTRAINT "CHK_sales_total_amount" CHECK ("total_amount" >= 0),
        CONSTRAINT "FK_sales_outlet" FOREIGN KEY ("outlet_id")
          REFERENCES "outlets" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sales_outlet_id"   ON "sales" ("outlet_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_created_at"  ON "sales" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_sales_outlet_date" ON "sales" ("outlet_id", "created_at")`);

    // ──────────────────────────────────────────────
    // sale_items
    // ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id"                  UUID           NOT NULL DEFAULT gen_random_uuid(),
        "sale_id"             UUID           NOT NULL,
        "outlet_menu_item_id" UUID           NOT NULL,
        "quantity"            INTEGER        NOT NULL,
        "unit_price"          NUMERIC(12, 2) NOT NULL,
        "subtotal"            NUMERIC(14, 2) NOT NULL,
        CONSTRAINT "PK_sale_items" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_sale_items_quantity"  CHECK ("quantity"  > 0),
        CONSTRAINT "CHK_sale_items_unit_price" CHECK ("unit_price" >= 0),
        CONSTRAINT "CHK_sale_items_subtotal"  CHECK ("subtotal"  >= 0),
        CONSTRAINT "FK_sale_items_sale" FOREIGN KEY ("sale_id")
          REFERENCES "sales" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sale_items_omi" FOREIGN KEY ("outlet_menu_item_id")
          REFERENCES "outlet_menu_items" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sale_items_sale_id"             ON "sale_items" ("sale_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sale_items_outlet_menu_item_id" ON "sale_items" ("outlet_menu_item_id")`);
    // Composite index used by top-5 reporting query
    await queryRunner.query(`CREATE INDEX "IDX_sale_items_omi_qty" ON "sale_items" ("outlet_menu_item_id", "quantity")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sale_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sales"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outlet_receipt_sequences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outlet_inventory"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outlet_menu_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outlets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
  }
}
