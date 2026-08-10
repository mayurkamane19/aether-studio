# Aether Studio — Client Experience 3.0 & Collaboration Hub Architecture

This document details the Client Experience 3.0 system, Project Workspace components, Change Request lifecycle, Support Ticket workflows, Deliverable Approvals, Client Data Isolation, IDOR protection, and Notification centers for **Aether Studio**.

---

## 1. Client Collaboration Workspace Architecture

```
Client Access Token (Raw Token)
               │
               ▼
     SHA-256 Hashed Token Verification (getClientPortalDataByToken)
               │
               ▼
  Lead Ownership Resolved (lead_id)
               │
               ▼
┌───────────────────────────────────────────────────────────┐
│               Client-Safe Data Workspace                  │
├───────────────────────────────┬───────────────────────────┤
│ Active Projects & Milestones  │ Client Deliverables (v1)  │
│ Change Requests (CHG-2026)    │ Support Tickets (OPEN)    │
│ Client Notifications (Unread) │ Invoices & Payment Status │
│ Client-Safe Meeting Requests  │ Client Activity Timeline  │
└───────────────────────────────┴───────────────────────────┤
```

---

## 2. Change Request Lifecycle & Linkage

- **Statuses**: `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` -> `COMPLETED`.
- **Linkage**: Change requests (`client_change_requests`) link deliverables to internal tasks without exposing internal team estimates, hourly rates, or developer task notes to the client.

---

## 3. Strict Privacy & Data Isolation

- **IDOR Protection**: All client API requests resolve ownership server-side using SHA-256 portal tokens (`token`). Client A CAN NEVER view or mutate Client B's projects, deliverables, tickets, messages, or invoices.
- **Admin Exclusions**: Internal CRM notes, team workload metrics, internal AI scores, financial strategies, audit events, and Phase 18 AI Business Copilot ARE STRICTLY EXCLUDED from client portal responses.
