# Architecture Documentation

## 1. Entity Relationship Diagram (ERD)

> Rendered by Mermaid — visible natively on GitHub, GitLab, and VS Code with the **Markdown Preview Mermaid Support** extension.

```mermaid
erDiagram

  %% ─────────────────────────────────────────
  %% CORE ENTITIES
  %% ─────────────────────────────────────────

  companies {
    uuid   id           PK
    varchar(120) name   UK  "Company display name"
    varchar(50)  code   UK  "Short identifier e.g. DEMO"
    timestamptz  created_at
    timestamptz  updated_at
  }

  outlets {
    uuid   id           PK
    uuid   company_id   FK  "→ companies.id"
    varchar(120) name
    varchar(20)  code   UK  "e.g. OUT-A"
    varchar(255) address
    timestamptz  created_at
    timestamptz  updated_at
  }

  menu_items {
    uuid   id           PK   "Master menu, managed by HQ"
    varchar(150) name
    varchar(100) category
    numeric(12_2) base_price  "Default price; CHECK >= 0"
    varchar(500)  description
    boolean  is_active        "Soft-delete flag"
    timestamptz   created_at
    timestamptz   updated_at
  }

  %% ─────────────────────────────────────────
  %% ASSIGNMENT + PRICE OVERRIDE
  %% ─────────────────────────────────────────

  outlet_menu_items {
    uuid   id              PK
    uuid   outlet_id       FK   "→ outlets.id"
    uuid   menu_item_id    FK   "→ menu_items.id"
    numeric(12_2) override_price  "NULL = use base_price; CHECK >= 0"
    boolean  is_available         "Toggle per outlet"
    timestamptz  created_at
    timestamptz  updated_at
  }

  %% ─────────────────────────────────────────
  %% INVENTORY
  %% ─────────────────────────────────────────

  outlet_inventory {
    uuid    id                   PK
    uuid    outlet_menu_item_id  FK  UK  "→ outlet_menu_items.id  (1-to-1)"
    integer quantity                     "Stock level; CHECK >= 0 (DB constraint)"
    timestamptz updated_at
  }

  %% ─────────────────────────────────────────
  %% RECEIPT SEQUENCING (concurrency-safe)
  %% ─────────────────────────────────────────

  outlet_receipt_sequences {
    uuid    id             PK
    uuid    outlet_id      FK  UK  "→ outlets.id  (1 row per outlet)"
    integer last_sequence          "Incremented inside SELECT … FOR UPDATE"
    timestamptz updated_at
  }

  %% ─────────────────────────────────────────
  %% SALES TRANSACTIONS
  %% ─────────────────────────────────────────

  sales {
    uuid    id              PK
    uuid    outlet_id       FK   "→ outlets.id"
    varchar(60) receipt_number  UK  "e.g. OUT-A-20260311-0001"
    numeric(14_2) total_amount      "Immutable; CHECK >= 0"
    timestamptz   created_at
  }

  sale_items {
    uuid    id                   PK
    uuid    sale_id              FK   "→ sales.id"
    uuid    outlet_menu_item_id  FK   "→ outlet_menu_items.id"
    integer quantity                  "CHECK > 0"
    numeric(12_2) unit_price          "Captured at sale time; CHECK >= 0"
    numeric(14_2) subtotal            "quantity × unit_price; CHECK >= 0"
  }

  %% ─────────────────────────────────────────
  %% RELATIONSHIPS
  %% ─────────────────────────────────────────

  companies          ||--o{ outlets                  : "owns (1 company → many outlets)"
  outlets            ||--o{ outlet_menu_items         : "has menu assignments"
  menu_items         ||--o{ outlet_menu_items         : "assigned to outlets"
  outlet_menu_items  ||--||  outlet_inventory          : "has stock (1-to-1)"
  outlets            ||--||  outlet_receipt_sequences  : "has receipt counter (1-to-1)"
  outlets            ||--o{ sales                     : "processes sales"
  sales              ||--o{ sale_items                : "contains line items"
  outlet_menu_items  ||--o{ sale_items                : "referenced by sale lines"
```

---

### Key Design Decisions

| Decision                                                 | Rationale                                                                                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `outlet_menu_items` as junction table                    | Decouples master menu from per-outlet availability and price. HQ controls `menu_items`; outlets can only see what's assigned.                                          |
| `override_price` nullable on `outlet_menu_items`         | `NULL` means "use `menu_items.base_price`". A non-null value overrides per outlet with no duplication.                                                                 |
| `outlet_inventory` is 1-to-1 with `outlet_menu_items`    | Each assigned item has exactly one stock record per outlet. `CHECK quantity >= 0` at DB level prevents negative stock even on concurrent writes.                       |
| `outlet_receipt_sequences` with `SELECT … FOR UPDATE`    | One counter row per outlet, locked before increment. Guarantees monotonic, gap-free sequential receipt numbers under concurrent requests without a sequence per table. |
| Immutable `total_amount` and `unit_price` on sale tables | Prices captured at transaction time are never recalculated. Menu price changes don't corrupt historical receipts.                                                      |
| All monetary values as `NUMERIC`                         | Avoids IEEE-754 floating-point rounding errors for currency arithmetic.                                                                                                |

---

## 2. Scaling Plan (10 Outlets · 100,000 Transactions/Month)

> _To be completed in Phase 6._

---

## 3. Microservices Evolution Strategy

> _To be completed in Phase 6._

---

## 4. Offline POS / KDS Sync Strategy

> _To be completed in Phase 6._
