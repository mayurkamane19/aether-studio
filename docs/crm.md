# Aether Studio — Production CRM & Lead Management System Architecture

This document describes the production CRM system, API endpoints, PostgreSQL database tables, status lifecycle, lead scoring rules, security architecture, and deployment procedures for **Aether Studio**.

---

## 1. CRM System Architecture

The Aether Studio CRM is built on a serverless PostgreSQL architecture integrated directly into the creative agency platform. It manages inbound leads from initial contact submission through AI evaluation, pricing calculation, proposal versioning, automated follow-ups, and sales conversion analytics.

### Key Architecture Principles
- **Public Website Isolation**: The public agency homepage operates completely independently. It does NOT wait for database connection, CRM initialization, or serverless analytics queries.
- **Serverless Security**: All CRM endpoints (`/api/inquiry`, `/api/admin/*`, `/api/cron/*`) run as serverless functions protected by `ADMIN_CRM_TOKEN` or `CRON_SECRET`.
- **Zero Secrets Exposure**: API keys (`RESEND_API_KEY`, `OPENAI_API_KEY`), database connection strings (`DATABASE_URL`), and tokens are kept strictly in server-side environment variables.

---

## 2. API Endpoints

| Endpoint | Method | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `/api/contact` | `POST` | Public | Submits inbound project inquiry, inserts lead into PostgreSQL, sends Resend email to admin and auto-reply to visitor. |
| `/api/inquiry` | `GET`, `PATCH`, `POST` | `Bearer ADMIN_CRM_TOKEN` | Fetches paginated leads with search/filters, updates lead status, and handles internal admin notes. |
| `/api/admin/analyze` | `POST` | `Bearer ADMIN_CRM_TOKEN` | Evaluates project brief via AI Sales Intelligence engine. |
| `/api/admin/pricing` | `POST` | `Bearer ADMIN_CRM_TOKEN` | Calculates internal AI price recommendations, risk breakdown, and processes admin approval workflow. |
| `/api/admin/proposal` | `POST` | `Bearer ADMIN_CRM_TOKEN` | Generates proposal versions (`PROP-AS-2026-XXXXXX-V1`), saves draft to DB, and dispatches Resend email. |
| `/api/proposal` | `GET`, `POST` | Public (`access_token`) | Client interactive proposal viewer (`proposal.html`), view tracker (`SENT -> VIEWED`), and client acceptance/recline handler. |
| `/api/admin/followup` | `POST` | `Bearer ADMIN_CRM_TOKEN` | Admin manual follow-up dispatch, sequence pause, resume, and cancellation. |
| `/api/cron/followups` | `GET`, `POST` | `Bearer CRON_SECRET` | Scheduled Vercel Cron engine for automated follow-up delivery (+2d, +5d, +10d). |
| `/api/admin/analytics` | `GET` | `Bearer ADMIN_CRM_TOKEN` | Serverless analytics aggregator for KPIs, conversion funnels, pipeline values, and CSV export. |

---

## 3. Database Schema

The database consists of 7 PostgreSQL tables configured via safe, idempotent migrations in `docs/migrations/`:

1. **`leads`**: Core lead record (`lead_id`, `name`, `email`, `company`, `project_type`, `budget`, `timeline`, `status`, `lead_score`, `source`, `followup_enabled`, `created_at`, `updated_at`).
2. **`lead_notes`**: Confidential internal admin notes (`lead_id`, `note`, `created_at`).
3. **`lead_activity`**: Audit trail timeline log (`lead_id`, `activity_type`, `description`, `created_at`).
4. **`lead_ai_analysis`**: Historical AI brief evaluation records (`score`, `priority`, `complexity`, `risk_flags`, `missing_information`).
5. **`lead_pricing_analysis`**: Historical AI pricing recommendations & approval status.
6. **`proposals`**: Official project proposals (`proposal_id`, `version`, `status`, `total`, `payment_schedule`, `access_token`, `sent_at`, `viewed_at`, `accepted_at`).
7. **`lead_followups`**: Scheduled automated follow-up sequence steps (`followup_type`, `sequence_number`, `scheduled_at`, `status`).

---

## 4. Status Lifecycle

Lead progression follows a strict whitelist of statuses:
- **`NEW`**: Inbound inquiry received from contact form or consultation booking.
- **`CONTACTED`**: Initial response dispatched to visitor.
- **`QUALIFIED`**: Project specs and scope requirements verified.
- **`PROPOSAL_SENT`**: Official proposal generated and sent to client.
- **`NEGOTIATION`**: Client reviewing proposal or discussing milestone terms.
- **`WON`**: Proposal accepted by client; lead converted.
- **`LOST`**: Inquiry closed or declined by client.

---

## 5. Deterministic Lead Scoring (0–100)

Lead scores are calculated deterministically to provide instant, explainable qualification:
- **0–39 (Cold)**: Low budget range (< ₹15,000) or missing project description.
- **40–69 (Warm)**: Standard budget range (₹15,000–₹35,000) with complete contact details.
- **70–100 (Hot)**: High enterprise budget (₹50,000+), AI/SaaS project type, or complete company requirements.

---

## 6. Activity Timeline & Internal Notes

- **Activity Timeline**: Every status update, proposal creation, client proposal view, acceptance, or follow-up dispatch automatically logs an event in `lead_activity`.
- **Internal Notes**: Confidential admin notes are stored in `lead_notes` and are strictly restricted to authorized admin users. They are never rendered on public views.

---

## 7. Security Model & Environment Variables

### Required Server Environment Variables
```env
DATABASE_URL=postgresql://YOUR_DATABASE_URL_HERE
ADMIN_CRM_TOKEN=your_secure_admin_secret_token_here
RESEND_API_KEY=re_your_actual_key_here
CONTACT_DESTINATION_EMAIL=your_email@example.com
CONTACT_FROM_EMAIL=Aether Studio Leads <onboarding@resend.dev>
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
CRON_SECRET=your_cron_secret_here
```

### Security Directives
- All SQL queries use parameterized arguments (`$1, $2, ...`) to prevent SQL injection.
- Public proposal URLs (`/proposal.html?id=...&token=...`) require a cryptographically random `access_token` and use `<meta name="robots" content="noindex, nofollow">`.
- Frontend code (`index.html`, `script.js`) contains **zero secrets**.

---

## 8. Deployment Instructions

1. **Deploy to Vercel**: Push commits to `origin main`. Vercel automatically deploys serverless functions.
2. **Execute Migrations**: Run SQL scripts `001_create_leads.sql` through `007_add_analytics_indexes.sql` in your PostgreSQL / Supabase SQL Editor.
3. **Set Environment Variables**: Add `DATABASE_URL`, `ADMIN_CRM_TOKEN`, `RESEND_API_KEY`, and `CRON_SECRET` in **Vercel Settings → Environment Variables**.
