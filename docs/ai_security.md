# Aether Studio — AI Security & Operational Safety Specification

This document details the security model, secret protection, model parameters, rate limiting, and audit logging for the **Aether Studio AI Agency Operating System**.

---

## 1. AI Security Directives

- **Zero Exposed Secrets**: `OPENAI_API_KEY`, `DATABASE_URL`, `ADMIN_CRM_TOKEN`, and `CRON_SECRET` remain strictly server-side environment variables. Secrets are NEVER rendered in HTML, JavaScript, `localStorage`, or client-side responses.
- **No Direct Database Access**: AI models and tools NEVER receive direct database connection strings (`DATABASE_URL`) and cannot execute arbitrary SQL queries. All data access is mediated through parameterized queries in `lib/db.js`.
- **Structured JSON Validation**: LLM completions enforce `response_format: { type: "json_object" }`. Malformed AI completions are caught safely and fall back to rule-based decision matrices.

---

## 2. AI Rate Limiting & Cost Control

- **Serverless API Limits**: `/api/admin/ai` and `/api/admin/copilot` enforce per-IP rate limits (10-20 requests / 60 seconds).
- **Context Bounding**: Input prompts are truncated to a maximum token threshold to prevent runaway API costs or context overflow attacks.
- **Audit Logging**: All generated AI recommendations, confidence levels, and admin approval/rejection decisions are logged in `ai_agency_actions` and `lead_activity`.
