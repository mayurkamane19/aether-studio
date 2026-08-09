# Aether Studio — Omnichannel Communication Center

This document details the Omnichannel Communication Center architecture, message routing rules, WhatsApp integration specs, email template handling, internal note security, and notification engine for **Aether Studio**.

---

## 1. Omnichannel Communication Architecture

The Communication Center unifies all agency touchpoints — inbound contact forms, outbound Resend emails, interactive client portal messages, WhatsApp direct action links, and system notifications — into a single unified PostgreSQL timeline.

### Core Security & Privacy Directives
- **Internal Note Isolation**: Notes created with `sender_type = 'INTERNAL_NOTE'` are stored strictly for admin strategy teams and are **NEVER returned in client portal API calls**.
- **Server-Side API Key Defense**: API keys (`RESEND_API_KEY`, `OPENAI_API_KEY`, `ADMIN_CRM_TOKEN`) remain strictly server-side environment variables and are never transmitted to frontend client browsers.
- **Client Consent & Opt-In Rules**: WhatsApp links are generated only when valid client phone numbers exist and consent rules permit. WhatsApp messages are NEVER sent automatically without admin initiation.
- **Unconfigured Service Transparency**: If inbound email parsing or live Meta WhatsApp Business API webhooks are unconfigured, the CRM explicitly displays `"Integration Not Configured"` rather than fabricating messages.

---

## 2. Database Schema

Managed via safe, idempotent migration [`docs/migrations/013_communication_center.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/013_communication_center.sql):

1. **`conversations`**: `id`, `lead_id`, `client_email`, `subject`, `status` (`OPEN` | `PENDING` | `RESOLVED` | `CLOSED`), `priority` (`LOW` | `NORMAL` | `HIGH` | `URGENT`), `channel` (`EMAIL` | `WHATSAPP` | `PORTAL`), `last_message_at`, `assigned_to`.
2. **`conversation_messages`**: `id`, `conversation_id`, `lead_id`, `sender_type` (`CLIENT` | `ADMIN` | `SYSTEM` | `INTERNAL_NOTE`), `sender_name`, `sender_email`, `channel`, `direction` (`INBOUND` | `OUTBOUND`), `subject`, `message`, `status` (`QUEUED` | `SENT` | `DELIVERED` | `READ`).
3. **`message_templates`**: `id`, `name`, `channel`, `subject`, `body`, `variables`, `is_active`.
4. **`notifications`**: `id`, `lead_id`, `type`, `title`, `message`, `priority`, `is_read`, `created_at`.

---

## 3. Serverless API Reference (`/api/admin/communications`)

Protected by `ADMIN_CRM_TOKEN`:
- `GET /api/admin/communications?leadId=...`: Fetches unified timeline messages, notifications, and active templates.
- `POST /api/admin/communications`: Dispatches outbound emails via Resend, logs portal messages, or records internal notes.
