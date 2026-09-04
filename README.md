# Plan vs Actual Budget Tracker

Plan vs Actual is a mini financial reporting tool for turning a monthly budget into a clear, useful report. Users set spending targets for categories, record their actual spending, and compare planned amounts with real results.

The project is being built as a backend-first application. The current implementation includes user authentication, category management, monthly budget plans, actual expense tracking (with CSV import), and period locking — all persisted in MongoDB with JWT-based auth and per-user data isolation. The reporting/variance view is the remaining module.

## Product Goals

- Create monthly spending plans by category.
- Record actual expenses against those categories.
- Compare planned, actual, and variance amounts.
- Make overspending and underspending easy to identify.
- Keep financial data isolated per authenticated user.
- Lock finalized periods to prevent further edits.
- Provide a foundation for monthly summaries and trend reporting.

## Project Structure

```text
.
├── README.md
└── server/
	├── package.json
	├── tsconfig.json
	├── jest.config.js
	├── .env.example
	├── src/
	│   ├── app.ts
	│   ├── server.ts
	│   ├── config/            # Environment and database setup
	│   ├── errors/            # Application error types
	│   ├── middleware/        # Auth and error middleware
	│   ├── models/            # Mongoose models (User, Category, Plan, Actual, Lock)
	│   ├── modules/
	│   │   ├── auth/          # Signup, login, and refresh flows
	│   │   ├── categories/    # Category creation and listing
	│   │   ├── plans/         # Monthly target creation/editing
	│   │   ├── actuals/       # Expense logging and CSV import
	│   │   └── locks/         # Period locking and lock enforcement
	│   ├── types/             # TypeScript declaration extensions
	│   └── utils/             # Token and security helpers
	└── tests/
		├── auth/               # Authentication behavior tests
		├── categories/         # Category behavior tests
		├── plans/              # Plan CRUD and lock-enforcement tests
		├── actuals/            # Actuals CRUD, CSV import, and lock-enforcement tests
		├── locks/              # Locking behavior tests
		└── setup/              # Test database lifecycle
```

## Requirements

- Node.js 20 or later.
- `pnpm` 11 or later.
- A MongoDB instance, local or hosted.

## Installation

From the repository root:

```powershell
cd server
pnpm install
```

Create a local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Update `server/.env` with values for your environment:

```env
PORT=4000
DB_URI=mongodb://127.0.0.1:27017/plan_vs_actual
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h
NODE_ENV=development
```

Use a strong, unique `JWT_SECRET` outside local development.

## Running the Server

Start the development server from `server/`:

```powershell
pnpm run dev
```

The server connects to MongoDB before listening. With the example configuration, the API is available at `http://localhost:4000`.

## API Overview

All routes below except `/api/auth/*` require an `Authorization: Bearer <token>` header. Every query is scoped to the authenticated user — no user can read or modify another user's data.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in, receive a JWT |
| POST | `/api/categories` | Create a category |
| GET | `/api/categories` | List the user's categories |
| PUT | `/api/plans` | Create or update a monthly target (upsert by category + month) |
| GET | `/api/plans?startMonth=&endMonth=` | List plans, optionally filtered by date range |
| POST | `/api/actuals` | Log a single actual expense |
| GET | `/api/actuals?startMonth=&endMonth=` | List actuals, optionally filtered by date range |
| POST | `/api/actuals/import` | Bulk import actuals via CSV (`multipart/form-data`, field name `file`) |
| POST | `/api/locks` | Lock a month (`{ "month": "2026-01" }`) |
| DELETE | `/api/locks/:month` | Unlock a month |
| GET | `/api/locks` | List all locked months |

### CSV import format

```csv
month,category,amount
2026-01,Marketing,4800
2026-01,Payroll,20500
2026-02,Payroll,19800
```

Categories referenced in the CSV must already exist for the user — the importer does not auto-create categories. Import is all-or-nothing: if any row fails validation (bad month format, unknown category, invalid amount), the entire import is rejected and nothing is inserted.

## Locking

Granularity: **month** (documented choice — quarter was the alternative but month aligns directly with how Plans and Actuals are already keyed).

A lock is a document keyed on `userId + month` in the `Lock` collection; its existence is the lock state (no separate boolean flag). Enforcement happens **server-side** in the service layer, not just hidden in the UI: `PUT /api/plans`, `POST /api/actuals`, and `POST /api/actuals/import` all check lock status before writing and reject with `423 Locked` if the target month is locked. CSV import checks every unique month present in the batch in a single query before inserting anything, so a locked month anywhere in the file blocks the whole import.

## CSRF

Not implemented. Authentication uses Bearer tokens sent via the `Authorization` header rather than cookies. Since browsers do not automatically attach this header to cross-origin requests (unlike cookies), CSRF — which relies on that automatic attachment — is not applicable to this architecture.

## Data Modeling & Indexing Notes

- `Category`: unique compound index on `(userId, name)` — prevents duplicate categories per user and supports fast category lookups during CSV import.
- `Plan`: unique compound index on `(userId, categoryId, month)` — one target per category per month, and matches the exact query shape the report view will use.
- `Actual`: non-unique compound index on `(userId, categoryId, month)` — multiple actual entries are allowed per category/month (e.g. several logged expenses); the report sums them.
- `Lock`: unique compound index on `(userId, month)`.
- CSV import processes rows in a single in-memory pass with a preloaded category map (one query instead of N), avoiding per-row database round trips.

## Testing

Run the complete test suite from `server/`:

```powershell
pnpm test
```

Run the TypeScript compiler without emitting files:

```powershell
pnpm exec tsc --noEmit
```

All tests use `mongodb-memory-server`, so a separate test MongoDB instance is not required. Coverage includes: signup/login, category creation and per-user isolation, plan upsert and validation, actuals CRUD and CSV import (including partial-failure and locked-month rejection), and lock creation/enforcement across both Plans and Actuals.

## Status / Remaining Work

- [x] Authentication (signup, login, JWT)
- [x] Categories
- [x] Plans (monthly targets)
- [x] Actuals (manual entry + CSV import)
- [x] Locking (month granularity, server-enforced)
- [ ] Report view (Plan vs Actual with variance, date-range filtering, chart)
- [ ] Deployment