# Aether Studio — Production Hardening & Security Specification

This document details the security architecture, authorization classification, IDOR prevention, prompt injection defenses, rate-limiting rules, and secret hygiene for **Aether Studio**.

---

## 1. API Endpoint Authorization Classification

| Endpoint | Method | Classification | Authorization Requirement | Rate Limit | Sensitive Data Exposed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/contact` | `POST` | `PUBLIC` | Honeypot & IP validation | 5 req / 15 min | None |
| `/api/booking` | `POST` | `PUBLIC` | Honeypot & IP validation | 5 req / 15 min | None |
| `/api/health` | `GET` | `PUBLIC` | None | Unlimited | None |
| `/api/proposal` | `GET`, `POST` | `CLIENT` | Access Token (`access_token`) | 20 req / 60 sec | Strictly client proposal details |
| `/api/client` | `GET`, `POST` | `CLIENT` | SHA-256 Portal Token | 20 req / 60 sec | Strictly client project summary |
| `/api/admin/inquiry` | `GET`, `POST`, `PATCH` | `ADMIN` | `Bearer ADMIN_CRM_TOKEN` | 100 req / min | CRM Leads & Notes |
| `/api/admin/copilot` | `POST` | `ADMIN` | `Bearer ADMIN_CRM_TOKEN` | 10 req / min | AI Next Best Actions |
| `/api/admin/analytics` | `GET` | `ADMIN` | `Bearer ADMIN_CRM_TOKEN` | 30 req / min | Aggregate Business Metrics |
| `/api/admin/invoices` | `GET`, `POST` | `ADMIN` | `Bearer ADMIN_CRM_TOKEN` | 30 req / min | Invoice & Payment Records |
| `/api/cron/followups` | `GET` | `CRON` | `Bearer CRON_SECRET` | Restricted | Internal Cron Execution |

---

## 2. Insecure Direct Object Reference (IDOR) Protection

- **Token Validation**: Client requests (`/api/client`, `/api/proposal`) MUST include a valid access token.
- **Server Authorization Context**: Client lead ID is derived directly from the authenticated `token_hash` in PostgreSQL. Client A can NEVER request or mutate Client B records.

---

## 3. Prompt Injection Security

Client lead messages, project scope notes, and email content are treated as **untrusted data**. AI prompts in `/api/admin/copilot` and `/api/admin/analyze` use explicit system delimiters (`JSON` format). AI output is recommendation-only and can NEVER execute SQL, modify lead status, or trigger payments automatically.

---

## 4. Secret Hygiene Rules
- `DATABASE_URL`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `ADMIN_CRM_TOKEN`, and `CRON_SECRET` remain strictly server-side environment variables.
- Secrets are NEVER included in HTML, CSS, JavaScript bundles, `localStorage`, `sessionStorage`, or documentation.
