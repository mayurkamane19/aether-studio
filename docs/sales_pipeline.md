# Aether Studio — Production Sales Pipeline, Proposal Lifecycle & Follow-up Engine

This document details the visual sales pipeline, deal valuation model, weighted pipeline probabilities, proposal lifecycle tracking, client interaction security, and automated follow-up sequence engine for **Aether Studio**.

---

## 1. Visual Sales Pipeline Stages & Probabilities

The Aether Studio Admin CRM provides a visual Kanban pipeline board to track project opportunities across seven sequential stages:

| Stage | Name | Description | Stage Probability |
| :--- | :--- | :--- | :--- |
| `NEW` | New Lead | Unscreened inbound inquiry from contact form or consultation booking. | 10% |
| `CONTACTED` | First Contact | Initial response dispatched to visitor. | 20% |
| `QUALIFIED` | Scope Qualified | Technical specs, deliverables, and budget verified. | 40% |
| `PROPOSAL_SENT` | Proposal Sent | Formal proposal created and sent (`PROP-AS-2026-XXXXXX-V1`). | 60% |
| `NEGOTIATION` | In Negotiation | Milestone schedules or package options under client review. | 80% |
| `WON` | Project Won | Proposal accepted by client; contract closed (`won_at` recorded). | 100% |
| `LOST` | Opportunity Lost | Lead closed or declined (`lost_at` and `lost_reason` recorded). | 0% |

---

## 2. Deal Valuation & Weighted Pipeline Formula

- **Estimated Deal Value (`estimated_value`)**: Estimated deal total in INR (default ₹35,000 to ₹1,50,000+).
- **Final Won Value (`final_value`)**: Preserved contract revenue recorded upon stage transition to `WON`.
- **Weighted Pipeline Calculation**:
  $$\text{Weighted Value} = \sum (\text{Stage Estimated Value} \times \text{Stage Probability})$$
  - Example: A ₹1,00,000 lead in `PROPOSAL_SENT` (60%) contributes **₹60,000** to the weighted pipeline.

---

## 3. Lost Opportunity Categorization

When a lead transitions to `LOST`, the admin must record one of seven standardized reasons:
1. `PRICE`: Client budget insufficient or quote exceeded expectations.
2. `TIMELINE`: Delivery schedule did not align with client launch target.
3. `COMPETITOR`: Client selected another visual agency.
4. `NO_RESPONSE`: Visitor stopped replying after multiple follow-ups.
5. `PROJECT_CANCELLED`: Internal project cancelled by client leadership.
6. `NOT_A_GOOD_FIT`: Scope outside agency technical focus.
7. `OTHER`: Custom reason logged in internal notes.

---

## 4. Proposal Lifecycle & Access Security

- **Proposal Status Flow**: `DRAFT` → `SENT` → `VIEWED` → `ACCEPTED` / `REJECTED` / `EXPIRED`.
- **Public Viewer URL**: `https://aetherstudio.com/proposal.html?id=PROP-AS-2026-XXXXXX-V1&token=<HEX_ACCESS_TOKEN>`
- **Security Guarantee**: Proposal URLs require a cryptographically random 48-character `access_token`. They reveal only client-facing project scope, deliverables, timeline, pricing, and terms. Internal lead scores, private admin notes, and database secrets are strictly omitted.

---

## 5. Automated Follow-up Sequence Engine

Automated follow-ups run via Vercel Cron (`/api/cron/followups`) on a 3-step schedule:
- **Step 1 (+2 Days)**: Gentle check-in regarding project brief.
- **Step 2 (+5 Days)**: Value proposition highlight & case study recommendation.
- **Step 3 (+10 Days)**: Final follow-up notice before closing inquiry.

### Automatic Disqualification Guardrails
Follow-ups are immediately halted (`CANCELLED`) if:
- Client accepts or declines proposal (`ACCEPTED` or `REJECTED`).
- Lead status transitions to `WON` or `LOST`.
- Admin manually pauses follow-ups (`followup_enabled = false`).

---

## 6. Serverless API Reference

- `GET /api/inquiry`: Fetch leads, status, search, and paginated records.
- `PATCH /api/inquiry`: Update lead stage, won/lost metadata, and lost reasons.
- `POST /api/admin/proposal`: Build proposal version, record database draft, and dispatch email.
- `POST /api/proposal/accept`: Public endpoint for client proposal acceptance.
- `POST /api/proposal/reject`: Public endpoint for client proposal rejection.
- `POST /api/admin/followup`: Manual follow-up control (send now, pause, resume, cancel).
- `GET /api/cron/followups`: Automated cron handler protected by `CRON_SECRET`.
