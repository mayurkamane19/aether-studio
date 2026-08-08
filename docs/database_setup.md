# Aether Studio — PostgreSQL / Supabase Database Setup Guide

This guide details the PostgreSQL database integration, environment variables, schema creation, and Vercel configuration for **Aether Studio**.

---

## 1. Required Environment Variable

Set `DATABASE_URL` in your server environment (Vercel Project Settings → Environment Variables):

```env
DATABASE_URL=postgresql://YOUR_DATABASE_URL_HERE
```

*Note: For Supabase, copy the Transaction Pooler or Direct Connection URI from **Project Settings → Database → Connection String**.*

---

## 2. Database Schema (`leads` table)

The database schema is defined in [`docs/migrations/001_create_leads.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/001_create_leads.sql):

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing internal integer ID |
| `lead_id` | `VARCHAR(50) UNIQUE` | Unique lead reference code (`AS-2026-XXXXXX`) |
| `name` | `VARCHAR(255)` | Visitor full name |
| `email` | `VARCHAR(255)` | Visitor email address |
| `company` | `VARCHAR(255)` | Visitor company name |
| `project_type` | `VARCHAR(255)` | Selected project category |
| `budget` | `VARCHAR(100)` | Selected project budget range |
| `timeline` | `VARCHAR(100)` | Selected project completion timeline |
| `preferred_contact` | `VARCHAR(100)` | Preferred communication channel |
| `message` | `TEXT` | Project description and guidelines |
| `status` | `VARCHAR(50)` | Lead status (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`) |
| `lead_score` | `INT` | Lead qualification score (0–100) |
| `source` | `VARCHAR(100)` | Inbound lead channel (`Website`, `Proposal Wizard`, etc.) |
| `created_at` | `TIMESTAMPTZ` | Timestamp when lead was submitted |
| `updated_at` | `TIMESTAMPTZ` | Timestamp when status was last updated |

---

## 3. Step-by-Step Supabase / PostgreSQL Setup

1. **Create Database**:
   - Create a project on [Supabase.com](https://supabase.com) or any PostgreSQL provider.
2. **Execute Migration Script**:
   - Open **Supabase SQL Editor**.
   - Copy and paste the contents of `docs/migrations/001_create_leads.sql`.
   - Click **Run** to create the `leads` table and indexes.
3. **Configure Vercel**:
   - Open **Vercel Settings → Environment Variables**.
   - Add `DATABASE_URL` with your connection string.
   - Save and redeploy.

---

## 4. Connection Pooling & Security Notes

- Connections are managed via [`lib/db.js`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/lib/db.js) using parameterized queries (`$1, $2, ...`) to prevent SQL injection.
- Connection pooling caps maximum active sockets to 5 to respect serverless concurrency limits.
- If `DATABASE_URL` is not set or database is temporarily unreachable, the system logs a safe server-side notice without breaking contact form email delivery or user experience.
