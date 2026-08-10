# Aether Studio — Unified Communication Center 2.0 Architecture

This document details the Unified Communication Center 2.0 system, Conversation & Message schemas, channel integration statuses (`CONFIGURED` / `NOT CONFIGURED`), SLA response metrics, internal notes isolation, and Resend email outbound dispatching for **Aether Studio**.

---

## 1. Unified Conversation Architecture

```
Supported Communication Channels:
├── CONTACT_FORM    (Website Contact API - Live)
├── EMAIL           (Resend Outbound API - Live / Inbound - Configured)
├── CLIENT_PORTAL   (Client Portal Chat - Live)
├── SUPPORT_TICKET  (Support Ticket Engine - Live)
├── MEETING         (Meeting Booking System - Live)
└── WHATSAPP        (Integration Ready - NOT CONFIGURED)
                         │
                         ▼
        getOrCreateConversation(lead_id, channel)
                         │
                         ▼
         addConversationMessage(conversation_id, direction, body, is_internal)
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
Client-Facing Channel             Internal Notes Only
(CLIENT_PORTAL / EMAIL)        (is_internal = TRUE)
                                (Excluded from Client Portal)
```

---

## 2. Channel Integration Status Matrix

| Channel | Category | Configured Status | Integration Provider | Privacy & Security Isolation |
| :--- | :--- | :--- | :--- | :--- |
| **Website Contact** | `CONTACT_FORM` | **CONFIGURED (LIVE)** | PostgreSQL + Resend | Auto-Reply & Admin Gmail Dispatch |
| **Outbound Email** | `EMAIL` | **CONFIGURED (LIVE)** | Resend API (`RESEND_API_KEY`) | Internal Server-Side Execution |
| **Inbound Email** | `EMAIL` | **NOT CONFIGURED** | Resend Webhook Architecture | Webhook Idempotency & Signature Checks |
| **Client Portal** | `CLIENT_PORTAL` | **CONFIGURED (LIVE)** | Internal Serverless API | SHA-256 Token Authorization |
| **Support Tickets**| `SUPPORT_TICKET` | **CONFIGURED (LIVE)** | PostgreSQL `client_tickets` | Strict Client A / Client B Isolation |
| **Meeting Requests**| `MEETING` | **CONFIGURED (LIVE)** | PostgreSQL `meetings` | Client-Safe Meeting Confirmations |
| **WhatsApp API** | `WHATSAPP` | **NOT CONFIGURED** | Meta Business API Architecture | Requires Meta API Credentials |

---

## 3. Strict Internal Note Isolation Directive

- **Internal Note Guard (`is_internal = TRUE`)**: Internal agency notes created via `action = 'INTERNAL_NOTE'` are explicitly marked with `is_internal = true` in PostgreSQL `communication_messages` and are **STRICTLY EXCLUDED** from Client Portal views, Client AI context, and visitor email replies.
- **POST /api/contact Preservation**: `POST /api/contact` processes lead creation, PostgreSQL insertion, Resend Admin Gmail dispatch, and Visitor Auto-Reply without modification.
