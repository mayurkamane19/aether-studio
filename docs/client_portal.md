# Aether Studio — Secure Client Portal & Client Experience

This document details the Secure Client Portal architecture, token security model, client data isolation guarantees, milestone tracking, project updates, messaging, and admin access management for **Aether Studio**.

---

## 1. Client Portal Architecture & Overview

The Aether Studio Client Portal provides a dedicated, brand-aligned client portal interface (`/portal.html?token=<SECURE_TOKEN>`) allowing clients to review project proposals, track engineering milestones, view agency project updates, and exchange messages with the Aether Studio strategy team.

### Core Security Guarantees
- **Strict Client Data Isolation**: Client access tokens are validated on the server via SHA-256 hashes against PostgreSQL. Client A token ONLY returns Client A data. Client A can NEVER query Client B proposals or project data.
- **Zero Public Login Requirements**: The portal uses cryptographically random 64-character tokens (`crypto.randomBytes(32)`). No traditional password or public login page is added to the agency homepage.
- **Zero Secrets Exposure**: Internal lead scores, AI recommendations, confidential admin notes, database connection strings, and API secrets (`RESEND_API_KEY`, `OPENAI_API_KEY`) are strictly omitted from client responses.
- **SEO Protection**: All portal pages enforce `<meta name="robots" content="noindex, nofollow">` to prevent search engine indexing.

---

## 2. Token Security & Hashing Model

1. **Token Generation**: Admin triggers `POST /api/admin/client-portal` (`action: 'GENERATE'`). The server generates a random 64-hex-character token (`rawToken`).
2. **SHA-256 Hashing**: The server computes `tokenHash = SHA256(rawToken)` and stores ONLY the hash in `client_portals.token_hash`.
3. **Validation**: When a client opens `/portal.html?token=<rawToken>`, `GET /api/client` hashes the incoming token and matches it against active `client_portals` records (`is_active = true AND expires_at > NOW()`).

---

## 3. Database Schema

Managed via safe, idempotent migration [`docs/migrations/011_client_portal.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/011_client_portal.sql):

1. **`client_portals`**: `id`, `lead_id`, `token_hash`, `client_email`, `is_active`, `expires_at`, `last_accessed_at`, `created_at`.
2. **`project_milestones`**: `id`, `lead_id`, `title`, `description`, `status` (`PENDING` | `IN_PROGRESS` | `COMPLETED`), `due_date`, `completed_at`, `sort_order`.
3. **`project_updates`**: `id`, `lead_id`, `title`, `message`, `created_at`.
4. **`client_messages`**: `id`, `lead_id`, `sender_type` (`CLIENT` | `ADMIN`), `message`, `created_at`, `read_at`.

---

## 4. Serverless API Reference

- `GET /api/client?token=<TOKEN>`: Validates portal token and returns client-facing project summary, proposals, milestones, updates, and messages.
- `POST /api/client`: Allows clients to submit project messages (`senderType = 'CLIENT'`). Rate-limited to 20 requests/min.
- `POST /api/admin/client-portal`: Protected by `ADMIN_CRM_TOKEN`. Actions:
  - `GENERATE`: Generates a new 30-day client access link (`/portal.html?token=...`).
  - `REVOKE`: Immediately deactivates client portal tokens for the lead (`is_active = false`).

---

## 5. Audit Logging

Every portal event automatically logs an entry in `lead_activity`:
- `PORTAL_CREATED`: Admin generated a new portal link.
- `PORTAL_ACCESSED`: Client opened the portal URL.
- `MESSAGE_SENT`: Client or admin posted a message.
- `PORTAL_REVOKED`: Admin revoked portal access.
