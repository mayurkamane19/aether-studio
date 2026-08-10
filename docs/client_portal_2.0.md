# Aether Studio — Client Portal 2.0 & Collaboration Hub Architecture

This document details the Client Portal 2.0 architecture, SHA-256 token verification, deliverable approval workflows, IDOR safeguards, and Client AI privacy specs for **Aether Studio**.

---

## 1. Client Collaboration Hub Architecture

```
Authenticated Client Request (Token: portal_token)
                      │
                      ▼
   Cryptographic SHA-256 Token Hashing (lib/db.js)
                      │
                      ▼
  Server Authorization Context (Derived Lead ID)
  ├── 1. Client Projects & Milestones
  ├── 2. Deliverables (v1.0, v2.0) & Approvals
  ├── 3. Support Tickets & Client Messages
  └── 4. Client-Approved Meetings & Invoices
```

---

## 2. Insecure Direct Object Reference (IDOR) & Privacy Safeguards

- **Data Isolation Enforcement**: Client A token resolves directly to Client A's PostgreSQL lead ID. Client A can NEVER view or mutate Client B projects, deliverables, invoices, or support tickets.
- **Strict Data Exclusion**: Internal team notes, team workload metrics, internal AI scores, financial strategies, and internal audit events are EXCLUDED from client portal responses.

---

## 3. Deliverables & Approval Workflow

$$\text{Deliverable Submitted (IN\_REVIEW)} \xrightarrow{\text{Client Portal}} \text{Client Review} \xrightarrow{\text{APPROVE\_DELIVERABLE}} \text{Status: APPROVED}$$

- **Server-Side Authorization**: Deliverables require explicit client action. Deliverable approvals update status to `APPROVED` and record client feedback ratings without automatically altering contract or payment statuses.
