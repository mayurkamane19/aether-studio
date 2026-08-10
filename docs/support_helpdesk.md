# Aether Studio — Advanced Support & Helpdesk 2.0 Architecture

This document details the Support & Helpdesk 2.0 system, SLA Deadline tracking, Knowledge Base categorization, Escalation workflows, and Client Data Isolation for **Aether Studio**.

---

## 1. Support & Helpdesk Target Architecture

```
CLIENT (Portal Ticket Submission)
   │
   ▼
TICKET ENGINE (client_tickets)
├── TRIAGE & PRIORITY (LOW, NORMAL, HIGH, URGENT, CRITICAL)
├── SLA DEADLINES (First Response & Resolution Timers)
├── ESCALATION LEVELS (LEVEL_1 -> LEVEL_2 -> LEVEL_3)
├── KNOWLEDGE BASE (knowledge_articles / Client-Safe vs Internal)
└── SUPPORT CSAT & CUSTOMER SUCCESS INTEGRATION
```

---

## 2. SLA Deadlines & Internal Escalation Rules

- **Response SLA Thresholds**:
  - `CRITICAL`: 1 Business Hour
  - `HIGH`: 4 Business Hours
  - `NORMAL`: 12 Business Hours
  - `LOW`: 24 Business Hours
- **Internal Escalation**: Breached SLAs automatically trigger internal notifications (`createNotification()`) without sending negative automated messages to clients.

---

## 3. Strict Client Data Isolation

- **Internal Note Guard (`is_internal = TRUE`)**: Internal team comments, SLA breach commentary, developer debugging notes, and internal Knowledge Base articles are **STRICTLY EXCLUDED** from Client Portal views.
- **Client Access Tier**: Authenticated clients only view their own support tickets, client-visible reply messages, and published public Knowledge Base articles.
