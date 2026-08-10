# Aether Studio — Advanced Sales, Marketing & Client Acquisition Engine 2.0 Architecture

This document details the Sales & Marketing Engine 2.0 system, Lead Attribution taxonomy, UTM parameter capture, Lead Scoring algorithms, Campaign lifecycle, and Client Data Isolation directives for **Aether Studio**.

---

## 1. Sales & Client Acquisition Target Architecture

```
VISITOR (utm_source, utm_campaign)
   │
   ▼
POST /api/contact -> saveLead() & saveLeadAttribution()
   │
   ▼
LEAD SCORING 2.0 (Budget, Timeline, Project Type, AI Intelligence)
   │
   ▼
SALES PIPELINE STAGES
├── NEW -> QUALIFIED -> DISCOVERY -> PROPOSAL -> NEGOTIATION -> WON -> REVENUE
└── MARKETING CAMPAIGNS & SEQUENCES (DRAFT -> RUNNING -> COMPLETED)
```

---

## 2. UTM Parameter Capture & Lead Attribution

- **UTM Fields Captured**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, and HTTP `referrer`.
- **Contact API Protection**: `POST /api/contact` captures UTM parameter values safely without altering existing validation rules, PostgreSQL lead creation, or Resend email dispatches.

---

## 3. Strict Client Privacy & Consent Directives

- **Exclusion of Internal Sales Data**: Lead scores (`0-100`), internal sales notes, pipeline stages, conversion velocity, and campaign strategies are **STRICTLY EXCLUDED** from Client Portal views.
- **Marketing Consent & Unsubscribe**: Marketing campaigns respect consent statuses (`OPTED_IN`, `OPTED_OUT`). Opt-out requests exclude contacts from marketing emails without blocking essential transactional dispatches (Invoices, Receipts, Security Notifications).
