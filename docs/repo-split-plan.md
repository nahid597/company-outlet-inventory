# Repo Split Plan

## Goal

Evolve from a single repository into independently deployable services while preserving shared contracts.

This version uses a pragmatic split: fewer, broader services grouped by tightly related business flows.

## Guiding Principles

- Split by business capability, not by technical layer.
- One service owns one write model (single source of truth).
- Prefer asynchronous integration for cross-domain updates.
- Keep checkout-critical paths strongly consistent where required.
- No shared database writes across services.
- Prefer 3-4 services for current scale; avoid premature fine-grained service sprawl.

## Target Service Landscape

### Core Runtime Services

1. `operations-service` (Menu + Outlet Config + Inventory)
   - Owns: `menu_items`, `outlet_menu_items`, `outlet_inventory`
   - APIs: menu CRUD, assignment/availability/override, stock set/adjust
   - Reason: these domains change together operationally and are frequently used by same users.

2. `commerce-service` (Sales + Receipt Sequencing)
   - Owns: `sales`, `sale_items`, `outlet_receipt_sequences`
   - APIs: create sale, recent sales, receipt retrieval
   - Reason: checkout must stay strongly consistent and isolated from broader ops churn.

3. `insights-service` (Reporting)
   - Owns: read models/materialized views only
   - APIs: revenue by outlet, top items, trends
   - Reason: analytics workloads should not impact OLTP paths.

Optional later:

4. `identity-access-service` (only if org complexity grows)

### Not Separate Yet (Keep Internal Modules First)

- KDS orchestration
- Notification delivery
- Audit/compliance stream

These can remain modules inside existing services until scale/ownership pain is proven.

## Data Ownership and Storage Boundaries

- Each service owns its schema or database.
- Reporting reads from replicated events/read store, not production write tables.
- Cross-service writes are forbidden; communicate via API/event.
- Use Outbox pattern for reliable event publication from write transactions.

## Event and Contract Strategy

- Source of truth contracts:
  - OpenAPI per service for sync APIs
  - AsyncAPI/JSON Schema for domain events
- Contract repository:
  - `/openapi/<service>/<version>.yaml`
  - `/events/<domain>/<event>.schema.json`
- Contract versioning:
  - Major: breaking
  - Minor: additive
  - Patch: clarification/non-functional
- Compatibility rule:
  - Consumers must tolerate additive event fields.
