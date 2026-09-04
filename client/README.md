# Plan vs Actual — Frontend

React + TypeScript + Vite client for the Plan vs Actual Budget Tracker API.

## Setup

```bash
pnpm install
cp .env.example .env
```

Update `.env` if your backend isn't running on `http://localhost:4000`:

```
VITE_API_BASE_URL=http://localhost:4000/api
```

## Run

```bash
pnpm dev
```

Opens at `http://localhost:5173`. Requires the backend server to be running.

## Build

```bash
pnpm build
```

## Notes

- Auth uses Bearer tokens (stored in `localStorage`), matching the backend's
  header-based JWT auth — no CSRF handling needed on this side either, for the
  same reason it wasn't needed on the backend.
- Locked-month errors (HTTP 423) from the API are surfaced directly in the UI
  as a message, both for manual Plan/Actual entry and CSV import.
- The CSV importer expects `month,category,amount` columns; categories must
  already exist before import (the backend doesn't auto-create them).
