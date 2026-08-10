# Aether Studio — Performance, Scalability & Reliability 3.0 Architecture

This document details the Performance 3.0 system, PostgreSQL connection pooling, request timeouts, bounded retries, server-side pagination, caching directives, and graceful degradation for **Aether Studio**.

---

## 1. Performance & Scalability Architecture

```
HTTP REQUEST (Public Visitor / Client / Admin)
                     │
                     ▼
           SERVERLESS ENGINE (Vercel Node.js Functions)
           ├── PRELOADER PROTECTION (Public homepage loads independently 0% -> 100%)
           ├── DB CONNECTION POOLING (lib/db.js / Connection reuse & idle timeouts)
           ├── REQUEST TIMEOUTS & BOUNDED RETRIES (Max 3 retries / Non-blocking AI fallback)
           └── SERVER-SIDE PAGINATION & CACHING (Limit 50 records / Freshness guards)
```

---

## 2. Graceful Degradation & Timeout Directives

- **Non-Blocking Public Website**: The public website preloader operates independently. Optional AI, analytics, or background services that experience latency or downtime DO NOT block public homepage rendering or contact form submissions.
- **Graceful Error Fallbacks**: If external AI or email services fail, APIs return safe degraded statuses (`status: "degraded"`) without throwing uncaught exceptions or leaking database connection strings.

---

## 3. Rate Limiting & Resource Limits

- **Rate Limits**: Rate limits protect expensive AI and reporting endpoints (`20 requests / 60 seconds per IP`).
- **Resource Limits**: File uploads block executables and enforce a 10MB size limit. Database queries enforce explicit `LIMIT` and `OFFSET` parameters.
