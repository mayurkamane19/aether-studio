# Aether Studio — Backup Strategy & Disaster Recovery Specification

This document details the PostgreSQL backup strategy, point-in-time recovery, emergency procedures, and RPO/RTO targets for **Aether Studio**.

---

## 1. Backup Strategy & Objectives

- **Primary Database**: PostgreSQL hosted on Supabase.
- **Automated Daily Backups**: Managed by Supabase (daily snapshots with 7-day retention).
- **Recovery Point Objective (RPO)**: < 24 hours (daily snapshot) or < 5 minutes if Point-In-Time-Recovery (PITR) is enabled.
- **Recovery Time Objective (RTO)**: < 1 hour to restore database instance and verify Vercel connectivity.

---

## 2. Disaster Recovery Protocol

1. **Verify Outage**: Check Supabase Dashboard and Vercel Deployment Logs.
2. **Database Restoration**: If data corruption occurs, trigger Point-In-Time-Recovery or restore latest daily snapshot in Supabase.
3. **Verify Environment Credentials**: Ensure `DATABASE_URL` is properly configured in Vercel Environment Variables.
4. **Execute Migrations**: Run SQL scripts [`docs/migrations/001_create_leads.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/001_create_leads.sql) through [`docs/migrations/014_production_indexes.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/014_production_indexes.sql) to re-apply any missing indexes or schemas.
5. **Production Smoke Testing**: Call `GET /api/health` and verify `database: "healthy"`.
