# Aether Studio — Agency Calendar & Scheduling Architecture

This document details the internal Agency Calendar, Event Categories, Client Meeting Management, Task Dependency DAG validation, and Timezone handling specs for **Aether Studio**.

---

## 1. Calendar Architecture & Event Taxonomy

- **Supported Event Categories**:
  - `MEETING`: Client consultations, project kickoffs, design reviews.
  - `TASK_DEADLINE`: Dynamic calendar view generated from task due dates.
  - `MILESTONE`: Key project milestone completion targets.
  - `PROJECT_DEADLINE`: Major project delivery target date.
  - `FOLLOW_UP`: CRM lead follow-up reminder.
  - `CLIENT_CALL`: Scheduled phone / video call with lead or client.
  - `INTERNAL_REVIEW`: Engineering / design sprint review.
  - `PROPOSAL_REVIEW`: Milestone proposal review meeting.
  - `INVOICE_DUE`: Financial payment due date reminder.

---

## 2. Meeting Action Item Workflow

$$\text{Scheduled Meeting} \xrightarrow{\text{Admin Notes}} \text{Action Items} \xrightarrow{\text{POST /api/admin/operations}} \text{Task Record (TSK-2026-XXXX)}$$

- **Client-Safe View Policy**: Internal notes, team workload metrics, AI risk scores, and internal review events are kept private. Only client-approved meeting dates and milestone targets are shared via secure client portal endpoints (`/portal.html?token=...`).

---

## 3. Serverless API Endpoint (`/api/admin/calendar`)

Protected by `ADMIN_CRM_TOKEN`:
- `GET /api/admin/calendar`: Fetches events by date range, meetings, and detects schedule conflicts.
- `POST /api/admin/calendar`: Creates events (`CREATE_EVENT`), schedules meetings (`CREATE_MEETING`), updates notes (`UPDATE_MEETING_NOTES`), and manages DAG task dependencies (`ADD_TASK_DEPENDENCY`).
