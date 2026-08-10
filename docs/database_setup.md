# Aether Studio — PostgreSQL / Supabase Database Setup & Migrations Guide

This guide details the PostgreSQL database integration, environment variables, schema migrations (001 to 007), and Vercel configuration for **Aether Studio**.

---

## 1. Required Environment Variables

Set `DATABASE_URL` and `ADMIN_CRM_TOKEN` in your server environment (Vercel Project Settings → Environment Variables):

```env
DATABASE_URL=postgresql://YOUR_DATABASE_URL_HERE
ADMIN_CRM_TOKEN=your_secure_admin_secret_token_here
```

*Note: For Supabase, copy the Transaction Pooler or Direct Connection URI from **Project Settings → Database → Connection String**.*

---

## 2. Database Schema Migrations List

The database schema is constructed from safe, idempotent migration scripts in `docs/migrations/`:

| Migration File | Description | Created Tables / Alterations |
| :--- | :--- | :--- |
| `001_create_leads.sql` | Core Leads Table | `leads` table with indexes on `lead_id`, `email`, `status`, `created_at` |
| `002_create_notes_and_activity.sql` | Internal Notes & Activity Audit | `lead_notes`, `lead_activity` tables & indexes |
| `003_add_ai_lead_intelligence.sql` | AI Lead Scoring & Evaluation History | Columns in `leads` & `lead_ai_analysis` history table |
| `004_add_ai_pricing_assistant.sql` | AI Project Pricing Assistant | Columns in `leads` & `lead_pricing_analysis` table |
| `005_add_proposal_management.sql` | Professional Proposal Management | `proposals` table & secure access token indexes |
| `006_add_lead_followups.sql` | Automated Lead Follow-up Engine | `lead_followups` table & `followup_enabled` column |
| `007_add_analytics_indexes.sql` | Advanced CRM Analytics Indexes | Indexes on `created_at`, `status`, `project_type`, `source`, `lead_score` |
| `008_sales_pipeline.sql` | Sales Pipeline & Deal Values | Deal value columns (`estimated_value`, `final_value`, `currency`, `won_at`, `lost_at`, `lost_reason`) & indexes |
| `009_ai_sales_copilot.sql` | AI Sales Copilot History | `lead_copilot_recommendations` table & indexes |
| `010_business_targets.sql` | Business Revenue Targets | `business_targets` table & indexes |
| `011_client_portal.sql` | Secure Client Portal Engine | `client_portals`, `project_milestones`, `project_updates`, `client_messages` tables & indexes |
| `012_invoicing.sql` | Invoicing & Payments Engine | `invoices`, `invoice_items`, `payments`, `credit_notes` tables & indexes |
| `013_communication_center.sql` | Omnichannel Communication Hub | `conversations`, `conversation_messages`, `message_templates`, `notifications` tables & indexes |
| `014_production_indexes.sql` | Production Performance Indexes | Performance indexes on `leads`, `invoices`, `messages`, `activity` |
| `015_ai_agency_os.sql` | AI Agency Operating System | `ai_agency_actions`, `ai_insights_cache` tables & indexes |
| `016_team_project_operations.sql` | Team & Project Operations | `team_members`, `projects`, `tasks`, `task_comments`, `time_entries` tables & indexes |
| `017_calendar_resource_planning.sql` | Agency Calendar & Scheduling | `calendar_events`, `meetings`, `task_dependencies` tables & indexes |
| `018_client_collaboration.sql` | Client Portal 2.0 & Collaboration | `client_deliverables`, `client_feedback`, `client_tickets`, `client_ticket_messages` tables & indexes |
| `019_document_management.sql` | Secure Document Management | `documents`, `document_versions`, `document_requests` tables & indexes |
| `020_automation_engine.sql` | Automation & Workflow Engine | `workflow_definitions`, `workflow_events`, `workflow_runs` tables & indexes |

---

## 3. Step-by-Step Supabase / PostgreSQL Setup

1. **Create Database**:
   - Create a project on [Supabase.com](https://supabase.com) or any PostgreSQL provider.
2. **Execute Migration Scripts**:
   - Open **Supabase SQL Editor**.
   - Copy and paste the contents of `docs/migrations/001_create_leads.sql` through `011_client_portal.sql`.
   - Click **Run** to execute the schema setup.
3. **Configure Vercel**:
   - Open **Vercel Settings → Environment Variables**.
   - Add `DATABASE_URL` and `ADMIN_CRM_TOKEN` with your values.
   - Save and redeploy.

---

## 4. Connection Pooling & Security Notes

- Connections are managed via [`lib/db.js`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/lib/db.js) using parameterized queries (`$1, $2, ...`) to prevent SQL injection.
- Connection pooling caps maximum active sockets to 5 to respect serverless concurrency limits.
- If `DATABASE_URL` is not set or database is temporarily unreachable, the system logs a safe server-side notice without breaking public website loading or contact form email delivery.
