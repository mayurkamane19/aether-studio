# Aether Studio — Client Collaboration & Support Ticket Specification

This document details the Support Ticket lifecycle, Feedback Rating schema, Deliverable Versioning, File Access Security, and Resend notification integration for **Aether Studio**.

---

## 1. Support Ticket Lifecycle & Priority Matrix

- **Support Ticket Statuses**: `OPEN` -> `IN_PROGRESS` -> `WAITING_FOR_CLIENT` -> `RESOLVED` (or `CLOSED`).
- **Priority Levels**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

---

## 2. Deliverable Versioning & Feedback Ratings

- **Deliverable Versioning**: Supports `v1.0`, `v1.1`, `v2.0` version history tags without overwriting past iterations.
- **Rating Schema**: 1 to 5 star ratings linked to specific deliverables via `client_feedback`.

---

## 3. Database Schema

Managed via safe migration [`docs/migrations/018_client_collaboration.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/018_client_collaboration.sql):

1. **`client_deliverables`**: `id`, `deliverable_id`, `project_id`, `lead_id`, `name`, `description`, `version`, `file_url`, `status`, `submitted_at`, `approved_at`.
2. **`client_feedback`**: `id`, `deliverable_id`, `lead_id`, `rating`, `feedback_type`, `comment`.
3. **`client_tickets`**: `id`, `ticket_id`, `lead_id`, `project_id`, `subject`, `description`, `priority`, `status`.
4. **`client_ticket_messages`**: `id`, `ticket_id`, `sender_type`, `sender_name`, `message`.
