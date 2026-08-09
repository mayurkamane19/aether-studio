# Aether Studio — Security Test Matrix

This document outlines the security test matrix across Public, Admin, Client, Webhook, and Cron endpoints for **Aether Studio**.

---

## Security Verification Matrix

| Endpoint | Test Case | Expected Status | Result |
| :--- | :--- | :--- | :--- |
| `POST /api/contact` | Valid Lead Payload | `200 OK` | **PASSED** |
| `POST /api/contact` | Rate Limit Violation (>5 req/15m) | `429 Too Many Requests` | **PASSED** |
| `GET /api/health` | Health Inspection Query | `200 OK` | **PASSED** |
| `GET /api/admin/inquiry` | Missing Admin Bearer Token | `401 Unauthorized` | **PASSED** |
| `GET /api/admin/inquiry` | Valid `Bearer ADMIN_CRM_TOKEN` | `200 OK` | **PASSED** |
| `GET /api/client` | Missing Portal Token | `400 Bad Request` | **PASSED** |
| `GET /api/client` | Invalid / Expired Portal Token | `401 Unauthorized` | **PASSED** |
| `GET /api/client` | Client A Token -> Query Client B Data | **BLOCKED** (Data Isolated) | **PASSED** |
| `GET /api/cron/followups` | Missing Cron Authorization | `401 Unauthorized` | **PASSED** |
