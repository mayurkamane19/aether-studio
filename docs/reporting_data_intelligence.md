# Aether Studio — Advanced Reporting & Data Intelligence 3.0 Architecture

This document details the Reporting & Data Intelligence 3.0 system, Executive KPI Dashboards, Custom Report Builders, Date Range filtering, Scheduled Reports, and Client Data Isolation for **Aether Studio**.

---

## 1. Centralized Reporting Layer Architecture

```
RAW BUSINESS DATA (CRM, Sales, Projects, Finance, Support, Customer Success)
                              │
                              ▼
           AUTHORIZED REPORTING ENGINE (api/admin/reports.js)
           ├── EXECUTIVE KPI DASHBOARD (Revenue, MRR, Pipeline Value, Retention)
           ├── CUSTOM REPORT BUILDER (Saved Configurations / saved_reports)
           ├── REPORT EXPORT SYSTEM (CSV / JSON Exports)
           └── CLIENT-SAFE REPORTING TIER (Strict Client Data Boundaries)
```

---

## 2. Metric Distinction & Financial Data Lineage

- **Metric Separation**: Revenue, Cash Collected, and Gross Profit are reported separately. Financial metrics explicitly display data lineage (e.g. `Revenue Source: Approved Invoices & Verified Payments`).
- **Insufficient Data Guard**: Metrics with insufficient historical data display `N/A` or `Insufficient Data` instead of fabricated zeroes or synthetic figures.

---

## 3. Strict Client Reporting Isolation

- **Client Data Tier**: Authenticated clients only access report views containing their own projects, tasks, milestones, tickets, deliverables, and invoices.
- **Exclusion of Internal Data**: Internal profit margins, gross margins, employee salaries, lead scores, agency churn risks, and internal team performance metrics are **STRICTLY EXCLUDED** from Client Portal views.
