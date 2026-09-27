# Personal Expense Tracker

A modern, full-stack personal finance and expense tracking web dashboard with real-time analytics and category breakdowns.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & File Structure](#architecture--file-structure)
- [Backend API Reference](#backend-api-reference)
- [Setup Instructions](#setup-instructions)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#environment-variables)
- [Roadmap & Architecture Notes](#roadmap--architecture-notes)
- [License](#license)

---

## Overview

**Personal Expense Tracker** is a self-hosted dashboard for tracking personal income and expenses. It provides real-time visual analytics, category-based spending breakdowns, and a clean interface for logging and reviewing transactions. Transactions are classified using a relational MySQL schema with `ENUM` cost types to distinguish **fixed** (e.g. rent, subscriptions) from **variable** (e.g. dining, entertainment) spending.

## Tech Stack

| Layer      | Technology                                                                 |
|------------|-----------------------------------------------------------------------------|
| Frontend   | Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| Backend    | Python, Flask (REST API), PyMySQL, DBUtils (`PooledDB`)                    |
| Database   | MySQL                                                                        |

---

## Architecture & File Structure

```text
personal-expense-tracker/
├── database/
│   └── schema.sql                  # Table definitions, ENUM types, and seed data
│
├── backend/
│   ├── app.py                      # Flask app entrypoint & API routes
│   ├── db.py                       # MySQL connection pool (PyMySQL + DBUtils PooledDB)
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Sample backend environment variables
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, providers, metadata)
│   │   ├── page.tsx                # Main dashboard entry page
│   │   └── globals.css             # Tailwind base styles & CSS variables
│   │
│   ├── components/
│   │   ├── Dashboard.tsx           # Top-level dashboard composition
│   │   ├── SpendingChart.tsx       # Recharts category/time spending visualization
│   │   ├── TransactionForm.tsx     # Add/edit transaction form
│   │   ├── CloudShader.tsx         # Decorative animated background shader
│   │   └── ui/
│   │       ├── apple-cards-carousel.tsx  # shadcn-style animated card carousel
│   │       ├── layout-text-flip.tsx      # Animated flipping text component
│   │       └── loader.tsx                # Loading state indicator
│   │
│   ├── lib/
│   │   ├── api.ts                  # Typed fetch wrapper for backend REST calls
│   │   └── utils.ts                # Utility helpers (cn, formatters, etc.)
│   │
│   ├── types/
│   │   └── index.ts                # Shared TypeScript types/interfaces
│   │
│   ├── components.json             # shadcn/ui configuration
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Backend API Reference

Base URL (local development): `http://localhost:5000`

| Method   | Endpoint                  | Purpose                                              |
|----------|----------------------------|-------------------------------------------------------|
| `GET`    | `/api/health`              | Health check — confirms the API and DB pool are up   |
| `GET`    | `/api/categories`          | Fetch the list of available expense categories        |
| `POST`   | `/api/transactions`        | Add a new transaction                                  |
| `GET`    | `/api/transactions`        | Fetch transactions (supports pagination & filtering)   |
| `DELETE` | `/api/transactions/<id>`   | Delete a transaction by its ID                         |
| `GET`    | `/api/summary`             | Aggregate spending by category and compute totals      |

### Example: `POST /api/transactions`

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Monthly Netflix Subscription",
    "amount": 15.99,
    "category_id": 4,
    "cost_type": "fixed",
    "transaction_date": "2026-09-28"
  }'
```

**Example response:**

```json
{
  "success": true,
  "data": {
    "id": 132,
    "description": "Monthly Netflix Subscription",
    "amount": 15.99,
    "category_id": 4,
    "cost_type": "fixed",
    "transaction_date": "2026-09-28",
    "created_at": "2026-09-28T10:15:32Z"
  }
}
```

---

## Setup Instructions

### 1. Database Setup

Create the database and load the schema (tables + seed data):

```bash
mysql -u root -p -e "CREATE DATABASE expense_tracker;"
mysql -u root -p expense_tracker < database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
```

**Create a virtual environment:**

macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials and app settings (see [Environment Variables](#environment-variables)).

**Run the Flask server:**

```bash
flask run --port=5000
```

The API will be available at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Ensure required dependencies are installed:**

```bash
npm install recharts framer-motion clsx tailwind-merge
```

**Configure environment variables:**

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

**Run the development server:**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

**Backend (`backend/.env`):**

```text
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=expense_tracker
FLASK_ENV=development
FLASK_APP=app.py
```

**Frontend (`frontend/.env.local`):**

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

---

## Roadmap & Architecture Notes

Planned enhancements and architectural improvements:

- **Authentication** — JWT- or session-based auth to support multi-user accounts and secure endpoints.
- **API Hardening** — Server-side rate limiting and stricter request validation/schema enforcement.
- **Database Migrations** — Adopt Alembic for versioned, repeatable schema migrations instead of static SQL scripts.
- **Reporting** — CSV and PDF export of transaction history and category summaries.

---

## License

This project is licensed under the [MIT License](LICENSE).
