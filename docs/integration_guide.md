# Aether Studio — Enterprise Lead Management & Automation Integration Guide

This guide details the complete technical architecture, serverless API endpoints, environment variables, security safeguards, and deployment workflows for **Aether Studio**.

---

## 1. Environment Variables Matrix
All backend credentials must be configured securely on Vercel Serverless Functions. **Never expose secrets in frontend JavaScript.**

| Environment Variable | Description | Example / Required Format |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Canonical Production Domain URL | `https://aetherstudio.com` |
| `RESEND_API_KEY` | Resend API Key for Email Dispatch | `re_your_api_key_here` |
| `CONTACT_DESTINATION_EMAIL` | Destination Inbox for Lead Notifications | `mayurkamane23@gmail.com` |
| `CONTACT_FROM_EMAIL` | Verified Sender Address | `Aether Studio Leads <onboarding@resend.dev>` |
| `ADMIN_CRM_TOKEN` | Bearer Secret for Admin Portal Auth | `your_secure_admin_token_here` |
| `DATABASE_URL` | PostgreSQL / Supabase Connection | `postgresql://user:pass@host:5432/db` |
| `CAL_COM_API_KEY` | Cal.com API Key for Booking Sync | `cal_live_your_key_here` |
| `OPENAI_API_KEY` | OpenAI Key for Live AI Evaluation | `sk-proj-your_key_here` |

---

## 2. Serverless API Architecture

### Inbound Contact API (`/api/contact`)
- **Method**: `POST`
- **Lead ID Generation**: Generates unique collision-resistant ID (`AS-2026-XXXXXX`).
- **Spam & Security**: Checks anti-spam honeypot field (`b_hp_field`), validates email format, enforces input length limits, and applies 5 req/min IP rate limiting.
- **Admin Email**: Sends structured lead summary to `CONTACT_DESTINATION_EMAIL`.
- **Visitor Auto-Reply**: Sends branded confirmation email to visitor email with Lead ID, 4-hour response SLA, project reference summary, and next-step advice.

### Consultation Booking API (`/api/booking`)
- **Method**: `POST`
- **Booking ID Generation**: Generates unique ID (`BK-2026-XXXXXX`).
- **Notifications**: Dispatches admin booking notification and visitor confirmation email via Resend.

### Client Inquiry API (`/api/inquiry`)
- **Methods**: `POST` (Create inquiry), `GET` (List inquiries — Admin Token protected).
- **Inquiry ID Generation**: Generates unique ID (`INQ-2026-XXXXXX`).

### Admin Proposal Generator API (`/api/admin/proposal`)
- **Method**: `POST`
- **Protection**: Requires `Authorization: Bearer <ADMIN_CRM_TOKEN>`.
- **Action**: Generates and emails formal PDF/HTML proposal to client upon explicit admin request.

### AI Brief Analyzer & Quote Assistant (`/api/admin/analyze`)
- **Method**: `POST`
- **Protection**: Requires `Authorization: Bearer <ADMIN_CRM_TOKEN>`.
- **Output**: Extracts category, complexity, recommended deliverables, suggested tech stack, risks, questions, and price range.

---

## 3. Security Audit & `.gitignore` Configuration
- `.gitignore` explicitly excludes `.env`, `.env.*`, `!.env.example`.
- All form inputs are sanitized to eliminate XSS/injection vectors.
- Error handlers return safe JSON responses without exposing stack traces or server file paths.

---

## 4. Local Testing & Production Vercel Deployment
1. To test locally:
   ```bash
   node scratch/verify_client_ready.js
   ```
2. Deploying to Vercel:
   - Commit and push changes to `origin main`.
   - Vercel automatically detects serverless endpoints under `/api/` and builds the site.
   - Configure environment variables under **Vercel Settings → Environment Variables**.
