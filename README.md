# Management System

HQ and multi-outlet F&B management system built with Node.js, Express, PostgreSQL, TypeORM, and React.

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| API        | Node.js 22, Express 5, TypeScript   |
| ORM        | TypeORM 0.3 (migrations + entities) |
| Database   | PostgreSQL 16                       |
| Validation | Zod 4                               |
| Frontend   | React 18, Vite 5, TypeScript        |
| Dev tools  | ts-node-dev, Docker Compose         |

---

## Setup Instructions

### Option A — Docker (recommended)

```bash
docker compose up --build
```

> On the first run the named volumes `api_node_modules` and `web_node_modules` are created
> inside the containers so host files never shadow installed packages.

| Service  | URL                          |
| -------- | ---------------------------- |
| Web UI   | http://localhost:5173        |
| API      | http://localhost:4000/api/v1 |
| Postgres | localhost:5433               |

Live-reload is enabled for both services — file changes on the host are picked up automatically via polling (required for Docker Desktop on macOS).

### Option B — Local

```bash
# 1. Start Postgres (or point .env at an existing instance)
docker compose up postgres -d

# 2. API
cd api
cp .env.example .env   # adjust values if needed
npm install
npm run dev            # http://localhost:4000

# 3. Frontend (new terminal)
cd web
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

---

## Environment Variables

### `api/.env.example`

| Variable      | Default             | Description                |
| ------------- | ------------------- | -------------------------- |
| `NODE_ENV`    | `development`       |                            |
| `PORT`        | `4000`              | HTTP port                  |
| `DB_HOST`     | `localhost`         | Postgres host              |
| `DB_PORT`     | `5433`              | Postgres port (host-side)  |
| `DB_USER`     | `postgres`          |                            |
| `DB_PASSWORD` | `postgres`          |                            |
| `DB_NAME`     | `management_system` |                            |
| `DB_SSL`      | `false`             | Set `true` for Neon/Render |

### `web/.env.example`

| Variable            | Default                        | Description  |
| ------------------- | ------------------------------ | ------------ |
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | API base URL |

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Health

| Method | Path      | Description                |
| ------ | --------- | -------------------------- |
| `GET`  | `/health` | Returns `{ status: "ok" }` |

---

### HQ — Master Menu

| Method  | Path                         | Description                                                |
| ------- | ---------------------------- | ---------------------------------------------------------- |
| `GET`   | `/hq/menu-items`             | List all master menu items (newest first)                  |
| `POST`  | `/hq/menu-items`             | Create a new menu item                                     |
| `PATCH` | `/hq/menu-items/:menuItemId` | Partially update a menu item (at least one field required) |

#### `POST /hq/menu-items` — request body

```jsonc
{
  "name": "Nasi Goreng", // required, 1–150 chars
  "category": "Main Course", // optional, nullable
  "basePrice": 12.5, // required, >= 0
  "description": "Fried rice", // optional, nullable
  "isActive": true, // optional, default true
}
```

#### `PATCH /hq/menu-items/:menuItemId` — request body

All fields optional; at least one must be provided.

```jsonc
{
  "name": "Nasi Goreng Special",
  "category": "Main Course",
  "basePrice": 14.0,
  "description": "Updated description",
  "isActive": false,
}
```

---

### HQ — Outlets & Assignment

| Method | Path                                           | Description                                          |
| ------ | ---------------------------------------------- | ---------------------------------------------------- |
| `GET`  | `/hq/outlets`                                  | List all outlets (ordered by code)                   |
| `PUT`  | `/hq/outlets/:outletId/menu-items/:menuItemId` | Assign (or update) a menu item for a specific outlet |

#### `PUT /hq/outlets/:outletId/menu-items/:menuItemId` — request body

```jsonc
{
  "overridePrice": 11.0, // optional; null = use base_price
  "isAvailable": true, // optional, default true
}
```

Response includes the `outletMenuItem` record with `overridePrice` and `isAvailable`.

---

### Outlet — Menu View

| Method | Path                            | Description                                                            |
| ------ | ------------------------------- | ---------------------------------------------------------------------- |
| `GET`  | `/outlets/:outletId/menu-items` | List available menu items for an outlet with `effectivePrice` resolved |

Response shape:

```jsonc
{
  "outlet": { "id": "...", "name": "Outlet A", "code": "OUT-A" },
  "items": [
    {
      "outletMenuItemId": "...",
      "menuItemId": "...",
      "name": "Nasi Goreng",
      "category": "Main Course",
      "basePrice": "12.50",
      "overridePrice": null,
      "effectivePrice": "12.50", // overridePrice ?? basePrice
      "isAvailable": true,
    },
  ],
}
```

---

### Outlet — Inventory

| Method  | Path                                             | Description                                             |
| ------- | ------------------------------------------------ | ------------------------------------------------------- |
| `GET`   | `/outlets/:outletId/inventory`                   | List stock levels for all assigned menu items in outlet |
| `PUT`   | `/outlets/:outletId/inventory/:outletMenuItemId` | Set absolute stock quantity                             |
| `PATCH` | `/outlets/:outletId/inventory/:outletMenuItemId` | Adjust stock by signed delta (positive or negative)     |

#### `PUT /outlets/:outletId/inventory/:outletMenuItemId` — request body

```jsonc
{
  "quantity": 80, // integer, >= 0
}
```

#### `PATCH /outlets/:outletId/inventory/:outletMenuItemId` — request body

```jsonc
{
  "delta": -3, // non-zero integer
}
```

Business rule: negative stock is blocked with `422` (`"Stock cannot go negative"`).

---

### Outlet - Sales (POS)

| Method | Path                       | Description                                 |
| ------ | -------------------------- | ------------------------------------------- |
| `GET`  | `/outlets/:outletId/sales` | List recent sales for an outlet (latest 10) |
| `POST` | `/outlets/:outletId/sales` | Create a sale transaction and receipt       |

#### `POST /outlets/:outletId/sales` - request body

```jsonc
{
  "items": [{ "outletMenuItemId": "uuid", "quantity": 2 }],
}
```

---

### HQ - Reporting

| Method | Path                                      | Description                        |
| ------ | ----------------------------------------- | ---------------------------------- |
| `GET`  | `/hq/reports/revenue-by-outlet`           | Revenue and sale counts by outlet  |
| `GET`  | `/hq/reports/outlets/:outletId/top-items` | Top sold items for selected outlet |

---

### Error Responses

All errors follow a consistent JSON shape:

```jsonc
// Validation error (400)
{ "message": "Validation failed", "issues": [ { "path": [...], "message": "..." } ] }

// Not found (404)
{ "message": "MenuItem not found" }

// Server error (500)
{ "message": "Internal server error" }
```

---

## Project Structure

```
management-system/
├── api/                    # Express + TypeORM API
│   └── src/
│       ├── config/         # Environment validation (Zod)
│       ├── controllers/    # Request handlers
│       ├── db/             # DataSource, migrations, seed
│       ├── entities/       # TypeORM entity classes
│       ├── middlewares/    # Error + not-found handlers
│       ├── repositories/   # Data-access layer
│       ├── routes/         # Express routers
│       ├── services/       # Business logic
│       ├── utils/          # HttpError class
│       └── validators/     # Zod schemas
├── web/                    # React + Vite frontend
│   └── src/
│       ├── App.tsx         # Dashboard tabs (Menu · Assignment · Outlet · Inventory · POS · Reports)
│       └── App.css
├── docs/
│   ├── architecture.md     # ERD + scaling/microservice/offline strategy
│   ├── deployment.md       # Deployment runbook
│   └── repo-split-plan.md  # Monorepo to split-repo roadmap
└── docker-compose.yml
```

---

## Schema Explanation

The database schema models one company operating multiple outlets with HQ-controlled menu and outlet-level operations.

Core schema flow:

1. `menu_items`

- Master menu definitions created by HQ.

2. `outlet_menu_items`

- Junction table connecting outlets to menu items.
- Stores outlet-specific `override_price` and availability toggles.

3. `outlet_inventory`

- One inventory record per outlet-assigned menu item.
- Enforces non-negative stock with DB-level check constraints.

4. `sales` and `sale_items`

- Immutable transaction records for receipt totals and line items.
- Prices are captured at sale time for historical correctness.

5. `outlet_receipt_sequences`

- Per-outlet counter for concurrency-safe sequential receipt numbers.

Refer to full ERD and field-level details in `docs/architecture.md`.

---

## Architecture Explanation

This project follows a layered architecture in the API:

- `routes`: endpoint mapping
- `controllers`: request parsing and response shaping
- `services`: business rules and transactional logic
- `repositories`: data access
- `validators`: Zod input validation schemas
- `middlewares`: centralized error and not-found handling

The frontend is organized by feature modules and centralized app state for HQ + outlet workflows (menu, assignment, inventory, POS sales, reporting).

Architecture and scaling details are documented in:

- `docs/architecture.md`
- `docs/repo-split-plan.md`
- `docs/deployment.md`

---

## Database

### Running migrations

```bash
cd api && npm run typeorm:migrate
```

### Seeding

```bash
cd api && npm run seed
```

The seed inserts 1 company, 3 outlets, 5 menu items, outlet assignments, and inventory records.
