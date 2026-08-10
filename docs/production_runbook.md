# Aether Studio — Production Operations Runbook

This document details the production deployment, environment variable configuration, database migration execution, and operational troubleshooting procedures for **Aether Studio**.

---

## 1. Environment Variable Inventory

| Environment Variable | Category | Required Scope | Usage / Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Persistence | Production Server-Side | PostgreSQL connection string |
| `RESEND_API_KEY` | Email | Production Server-Side | Resend email dispatch API key |
| `CONTACT_DESTINATION_EMAIL` | Email | Production Server-Side | Lead notification destination (`mayurkamane23@gmail.com`) |
| `ADMIN_CRM_TOKEN` | Security | Production Server-Side | Admin API Bearer token authorization |
| `OPENAI_API_KEY` | AI Copilot | Production Server-Side | OpenAI model API key |
| `CRON_SECRET` | Automation | Production Server-Side | Scheduled cron workflow secret |

---

## 2. Deployment & Rollback Execution

1. **Deploying to Vercel**: Production deployment is automatically triggered upon pushing clean, verified commits to `origin/main` via GitHub integration.
2. **Rollback Execution**: In case of production issues, use `vercel rollback` or revert the Git commit on `origin/main`.
