# Aether Studio — AI Agency Operating System Architecture

This document details the AI Agency Operating System architecture, serverless data pipeline, human-in-the-loop approval workflow, PII minimization, prompt injection isolation, and tool permissions for **Aether Studio**.

---

## 1. AI Agency Operating System Architecture

```
PostgreSQL Database Pool (Leads, Proposals, Messages, Invoices, Activity)
                        │
                        ▼
   Server-Side Context Builder (lib/ai_agency.js)
   ├── 1. PII Minimization (Filter sensitive tokens)
   ├── 2. Prompt Injection Isolation (System delimiters)
   └── 3. LLM Structured Completion (gpt-4o-mini JSON)
                        │
                        ▼
      AI Suggested Action Store (ai_agency_actions)
     [Status: SUGGESTED (Awaiting Human Approval)]
                        │
                        ▼
    Admin Review & Approval (POST /api/admin/ai)
     ├── Admin Clicks "Approve" -> Status: APPROVED
     └── Admin Executes Action -> Email / Proposal / Invoice Dispatched
```

---

## 2. Recommendation-Only & Human-in-the-Loop Workflow

- **Strict Approval Prerequisite**: AI operates strictly on a **recommendation-only** basis. AI suggestions are saved in `ai_agency_actions` with `status = 'SUGGESTED'`.
- **Prohibited Automatic Actions**: The AI CANNOT independently send emails, send WhatsApp messages, mark invoices paid, refund money, change SQL database records, or alter permissions without explicit admin review (`Draft -> Review -> Approve -> Execute`).

---

## 3. Data Isolation & Privacy Specs

- **Client Data Isolation**: AI evaluation for Lead A is constructed strictly from Lead A's PostgreSQL records. Client A's data is NEVER included in Client B's context window.
- **PII Minimization**: Unnecessary phone numbers, full residential addresses, card credentials, and authentication tokens are stripped before building LLM context.
- **Prompt Injection Defense**: Client-submitted messages are treated as untrusted string content inside system-segregated JSON objects to prevent prompt injection attacks.
