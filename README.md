# Personal Expense Tracker

Full-stack expense tracker: **Next.js (TypeScript, Tailwind v4, shadcn/ui)** frontend,
**Flask** REST API, **MySQL** database.

```
expense-tracker/
├── database/
│   └── schema.sql                # CREATE TABLE scripts + seed data
├── backend/
│   ├── app.py                    # Flask API & route handlers
│   ├── db.py                     # PooledDB + PyMySQL connection pool
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Template for DB credentials & CORS origins
├── frontend/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css           # Tailwind CSS directives & theme variables
│   │   ├── layout.tsx            # Root layout wrapper
│   │   └── page.tsx              # Main page rendering <Dashboard />
│   ├── components/
│   │   ├── Dashboard.tsx         # Central state manager & layout coordinator
│   │   ├── SpendingChart.tsx     # Recharts spending donut breakdown
│   │   ├── TransactionForm.tsx   # Add transaction form with fixed/variable toggles
│   │   ├── CloudShader.tsx       # Custom background shader wrapper
│   │   └── ui/
│   │       ├── apple-cards-carousel.tsx  # Carousel & Card components
│   │       ├── layout-text-flip.tsx      # Animated rotating header titles
│   │       └── loader.tsx                # LoaderOne animated spinner
│   ├── lib/
│   │   └── api.ts                # Fetch client (transactions, categories, summary, delete)
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces (Transaction, Category, Summary)
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
├── .gitignore                    # Ignores venv, node_modules, .next, and backend/.env
└── README.md
```

---

## 1. Database (MySQL)

```bash
mysql -u root -p < database/schema.sql
```

This creates the `expense_tracker` database with `users`, `categories`,
`transactions`, a demo user, and 10 default categories. `cost_type` on
`transactions` is the `ENUM('fixed','variable')` column that drives the
Fixed vs. Variable classification.

---

## 2. Backend (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your MySQL credentials

python app.py                   # runs on http://localhost:5000
```

Verify it's up:

```bash
curl http://localhost:5000/api/health
```

### Endpoints

| Method | Path                | Purpose                                      |
|--------|----------------------|-----------------------------------------------|
| GET    | `/api/health`         | Healthcheck                                   |
| GET    | `/api/categories`      | List categories (for the form dropdown)       |
| POST   | `/api/transactions`    | Create a transaction                          |
| GET    | `/api/transactions`    | Paginated transaction history (`limit`,`offset`, filters) |
| GET    | `/api/summary`         | Spend by category + fixed/variable breakdown, for charts |

Example create:

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "amount": 42.50,
    "transaction_date": "2026-09-15",
    "description": "Weekly groceries",
    "cost_type": "variable",
    "transaction_type": "expense"
  }'
```

---

## 3. Frontend (Next.js)

### 3.1 Scaffold the project

```bash
npx create-next-app@latest frontend \
  --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*"
cd frontend
```

> The files in this deliverable (`app/`, `components/`, `lib/`, `types/`)
> are meant to be dropped into that scaffolded project, overwriting the
> generated `app/page.tsx`, `app/layout.tsx`, and `app/globals.css`.

Tailwind v4 note: `create-next-app` now installs Tailwind v4 by default,
which is CSS-first (no `tailwind.config.js` needed) — config/tokens live
in `app/globals.css` via `@theme`, as already set up in that file.

### 3.2 Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted, accept the defaults so components resolve to:

- Components → `@/components/ui`
- Utils → `@/lib/utils`
- Styles/global CSS → `app/globals.css`

Then add the primitives this project uses:

```bash
npx shadcn@latest add button input select label card
```

### 3.3 Add your custom components

Drop your existing files in:

- `components/CloudShader.tsx`
- `components/ui/layout-text-flip.tsx`
- `components/ui/apple-cards-carousel.tsx` (exporting `Carousel` and `Card`)
- `components/ui/loader.tsx` (exporting `LoaderOne`)
- `components/ui/custom-button.tsx` (exporting `CustomButton`)

`Dashboard.tsx` and `TransactionForm.tsx` import these by name — adjust
the import paths/prop shapes to match your actual files if they differ.

Install the remaining runtime deps:

```bash
npm install recharts framer-motion
```

### 3.4 Point the frontend at the API

```bash
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5000" > .env.local
```

### 3.5 Run it

```bash
npm run dev     # http://localhost:3000
```

With the Flask server running on port 5000 and MySQL up, the dashboard
will fetch categories/summary/transactions on load, show `<LoaderOne>`
while fetching, render the Recharts pie chart from `/api/summary`,
list top categories in the `<Carousel>`, and let you submit new
transactions through the glassmorphism form — which triggers a refetch
of the chart and list.

---

## Notes / next steps for a production version

- Auth is stubbed out (`DEFAULT_USER_ID`) — swap in real sessions/JWT
  and drop the `user_id` query param in favor of a server-derived value.
- Add server-side validation/rate limiting in front of `POST /api/transactions`.
- Consider a migration tool (Alembic, Flyway) instead of a single `schema.sql`
  once the schema needs to evolve.
- The `/api/summary` endpoint accepts `start`/`end` query params
  (`YYYY-MM-DD`) already, so a date-range filter on the dashboard is a
  frontend-only addition.
