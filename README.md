# Management System

HQ and multi-outlet F&B management system built with Node.js, Express, PostgreSQL, TypeORM, and React.

## Quick Start (Phase 0)

1. Install dependencies:
   - `cd api && npm install`
   - `cd ../web && npm install`
2. Start backend:
   - `cd api && npm run dev`
3. Start frontend:
   - `cd web && npm run dev`
4. API health check:
   - `GET http://localhost:4000/api/v1/health`
5. Or use Docker:
   - `docker compose up --build`

## Project Structure

- `api/`: Express + TypeScript API with layered architecture
- `web/`: React + TypeScript frontend
- `docs/`: Architecture and design documents

## Environment Files

- `api/.env.example`
- `web/.env.example`

Copy each `.env.example` to `.env` when needed for local overrides.
