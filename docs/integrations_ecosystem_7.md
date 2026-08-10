# Aether Studio — Advanced Integrations & Ecosystem 7.0 Architecture

This document details the Integration Hub 7.0 system, Provider Abstraction layers, Webhook Engine, Signature verification rules, Idempotency guarantees, and Payment Replay Protection for **Aether Studio**.

---

## 1. Integration Hub & Ecosystem Architecture

```
EXTERNAL PROVIDER EVENTS (Webhooks / Resend / OpenAI / Payments)
                                │
                                ▼
           INTEGRATION ENGINE 7.0 (api/admin/integrations.js)
           ├── WEBHOOK SIGNATURE VERIFICATION (HMAC-SHA256 Payload validation)
           ├── WEBHOOK IDEMPOTENCY & REPLAY DEFENSE (event_id de-duplication)
           ├── PROVIDER ABSTRACTION LAYER (RESEND, OPENAI, SUPABASE_PG)
           └── UNCONFIGURED SERVICE FALLBACK (Reports 'NOT CONFIGURED' safely)
```

---

## 2. Webhook Signature & Idempotency Directives

- **Signature Verification**: Incoming webhook payloads require cryptographic HMAC-SHA256 signature verification. Unsigned or malformed webhook payloads are rejected automatically (`401 Unauthorized`).
- **Replay Protection**: Event IDs (`event_id`) are logged in `webhook_logs`. Duplicate webhooks are detected and rejected without executing secondary business side-effects.

---

## 3. Preserved Outbound Workflows

- **Email Pipeline Integrity**: `POST /api/contact` -> PostgreSQL -> Resend -> Admin Gmail & Visitor Auto-Reply is preserved without modification. Unconfigured third-party integrations return `NOT CONFIGURED` statuses without raising uncaught runtime exceptions.
