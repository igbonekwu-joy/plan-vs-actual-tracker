 # Plan vs Actual Budget Tracker

Plan vs Actual is a mini financial reporting tool for turning a monthly budget into a clear, useful report. Users set spending targets for categories, record their actual spending, and compare planned amounts with real results.

The project is being built as a backend-first application. The current foundation includes user authentication, MongoDB persistence, JWT access tokens, refresh-token rotation, and HTTP-only cookie storage. Budget planning, expense capture, and reporting are the next domain modules to be added on top of this foundation.

## Product Goals

- Create monthly spending plans by category.
- Record actual expenses against those categories.
- Compare planned, actual, and variance amounts.
- Make overspending and underspending easy to identify.
- Keep financial data isolated per authenticated user.
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
	│   ├── config/          # Environment and database setup
	│   ├── errors/          # Application error types
	│   ├── middleware/      # Auth and error middleware
	│   ├── models/          # Mongoose models
	│   ├── modules/auth/    # Signup, login, and refresh flows
	│   ├── types/            # TypeScript declaration extensions
	│   └── utils/            # Token and security helpers
	└── tests/
		├── auth/             # Authentication behavior tests
		└── setup/            # Test database lifecycle
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

## Testing

Run the complete test suite from `server/`:

```powershell
pnpm test
```

Run the TypeScript compiler without emitting files:

```powershell
pnpm exec tsc --noEmit
```

The authentication tests use `mongodb-memory-server`, so a separate test MongoDB instance is not required.