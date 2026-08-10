# Aether Studio — Global Scale, Performance & Reliability 8.0 Architecture

This document details the Global Scale 8.0 system, Performance baselines, Request Correlation IDs (`x-request-id`), Serverless connection pooling, Bounded retries, Rate limiting, and Disaster recovery for **Aether Studio**.

---

## 1. Global Scale & Reliability Architecture

```
HTTP REQUEST (Public Visitor / Client Portal / Admin Console)
                             │
                             ▼
              GLOBAL SCALE ENGINE 8.0 (Vercel Edge Node.js)
              ├── PRELOADER DEFENSE (Public homepage preloads 0% -> 100% independently)
              ├── REQUEST CORRELATION (x-request-id header propagation)
              ├── CONNECTION POOLING (lib/db.js / Idle timeouts & connection reuse)
              └── CIRCUIT BREAKERS & TIMEOUTS (Bounded retries & degraded fallbacks)
```

---

## 2. Request Correlation & Observability Directives

- **Request Correlation ID (`x-request-id`)**: All incoming API requests generate or propagate an explicit correlation ID to align frontend logs, serverless execution logs, and database query executions.
- **Fail-Safe Contact Dispatch**: `POST /api/contact` -> PostgreSQL -> Resend -> Admin Gmail & Visitor Auto-Reply is guaranteed fail-safe with explicit error logging.

---

## 3. Disaster Recovery & Fallback Matrix

| Subsystem | Failure Scenario | Fallback Procedure | Target SLA |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Pool Exhaustion / Outage | Degraded mode status returned; Public homepage loads seamlessly | < 15 Mins |
| **Resend Email API** | API Rate Limit / Failure | Lead saved in PostgreSQL; Degraded status logged | < 5 Mins |
| **OpenAI Copilot** | Model Outage / Timeout | Advisory message "AI temporarily unavailable"; Manual admin controls active | < 1 Min |
