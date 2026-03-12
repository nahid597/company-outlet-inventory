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

## Quick Start

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

## API Reference

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
│       ├── App.tsx         # 3-tab dashboard (HQ Menu · Assignment · Outlet Menu)
│       └── App.css
├── docs/
│   └── architecture.md     # ERD + design decisions
└── docker-compose.yml
```

---

## Database

### Running migrations

```bash
cd api && npm run migration:run
```

### Seeding

```bash
cd api && npm run seed
```

The seed inserts 1 company, 3 outlets, 5 menu items, outlet assignments, and inventory records.

---

## Implementation Progress

| Phase | Scope                                                    | Status     |
| ----- | -------------------------------------------------------- | ---------- |
| P0    | Monorepo scaffold, Docker, health endpoint               | ✅ Done    |
| P1    | DB schema, TypeORM entities, migrations, seed data       | ✅ Done    |
| P2    | Slice A — master menu CRUD, outlet assignment, menu view | ✅ Done    |
| P3    | Slice B — inventory (stock levels, adjustments)          | ⏳ Pending |
| P4    | Slice C — sales transactions, row locks, receipt numbers | ⏳ Pending |
| P5    | Slice D — reporting                                      | ⏳ Pending |
| P6    | Centralised validation, README, deploy, repo split       | ⏳ Pending |
