# Aether Studio — Advanced Client Experience & Self-Service 4.0 Architecture

This document details the Client Experience 4.0 self-service onboarding engine, Milestone approval workflows, Client Action Center, Document Approvals, Client-safe Health indicators, and Client IDOR protection for **Aether Studio**.

---

## 1. Client Self-Service & Onboarding Architecture

```
CLIENT PORTAL AUTHENTICATION (Sha-256 Token Verification)
                           │
                           ▼
          CLIENT EXPERIENCE ENGINE 4.0 (api/client.js)
          ├── ONBOARDING WORKFLOW (client_onboarding / Step tracking)
          ├── MILESTONE & DELIVERABLE APPROVALS (APPROVED / CHANGES_REQUESTED)
          ├── CLIENT ACTION CENTER ("ACTION REQUIRED" Aggregated Overview)
          ├── CLIENT-SAFE HEALTH INDICATOR (ON_TRACK / ATTENTION_NEEDED)
          └── REFERRAL SUBMISSION SYSTEM (Referral attribution)
```

---

## 2. Milestone Approvals & Document Reviews

- **Milestone Approval State**: Clients can approve milestones (`APPROVED`) or submit detailed feedback (`CHANGES_REQUESTED`). Every approval action is logged with server-side timestamps.
- **Client Action Center**: Aggregates all pending client tasks (e.g., pending document uploads, unpaid invoices, unapproved deliverables, and open feedback requests) into a unified `ACTION REQUIRED` workspace.

---

## 3. Strict Client IDOR & Security Isolation

- **Server-Side Token Ownership Verification**: Client identity is determined exclusively by the cryptographically verified SHA-256 portal access token. User-supplied `lead_id` or `client_id` URL parameters are **NEVER TRUSTED**. Client A cannot view, comment on, or approve resources belonging to Client B.
