# Aether Studio — Enterprise Backend & Production Integration Guide

This guide details the exact environment variables, API endpoints, and production backend integrations required for **Aether Studio**.

---

## 1. Domain Configuration
To point Aether Studio to a custom production domain (e.g. `https://aetherstudio.com`):

### Environment Variable
```env
NEXT_PUBLIC_SITE_URL=https://aetherstudio.com
```

### Files Configured for Automatic Domain Resolution
1. `config.js`: Controls `SITE_URL` fallback.
2. `sitemap.xml`: Contains canonical XML location tags.
3. `robots.txt`: Points to `https://aetherstudio.com/sitemap.xml`.
4. `index.html` & `blog/**/*.html`: Use central `<link rel="canonical">` and Open Graph `og:url` tags.

---

## 2. Professional Contact Form Email Delivery
The contact form uses a serverless API handler (`api/contact.js`) with an anti-spam honeypot (`b_hp_field`).

### Required Environment Variables
```env
# Resend API Key (https://resend.com)
RESEND_API_KEY=re_your_api_key_here

# Destination Email Address
CONTACT_DESTINATION_EMAIL=mayurkamane23@gmail.com
```

### Deployment Steps
1. Create a free account at [Resend.com](https://resend.com).
2. Generate an API Key and add your domain DNS records for email authentication (DKIM & SPF).
3. Set `RESEND_API_KEY` and `CONTACT_DESTINATION_EMAIL` in your Vercel / Netlify environment variables settings.

---

## 3. Consultation Booking & Calendar Integration
The booking engine (`#booking` section & `api/booking.js`) provides date and time slot selections with instant confirmation UI state.

### Required Environment Variables
```env
CAL_COM_API_KEY=cal_live_your_api_key_here
CAL_COM_EVENT_TYPE_ID=123456
```

### Integration Options
- **Option A (Cal.com API)**: Syncs selected date/time directly with Cal.com event type via `CAL_COM_API_KEY`.
- **Option B (Google Calendar API)**: Configure Google OAuth 2.0 service account credentials in server environment.

---

## 4. Client / Project Inquiry CRM & Admin Portal
Inquiries are processed via `api/inquiry.js` with structured lead schema (`id`, `name`, `email`, `company`, `projectType`, `budgetRange`, `timeline`, `status`).

### Required Environment Variables
```env
# PostgreSQL / Supabase Database Connection URL
DATABASE_URL=postgresql://postgres:your_password@db.your_supabase_project.supabase.co:5432/postgres

# Admin Portal Authorization Bearer Token
ADMIN_CRM_TOKEN=your_secure_admin_secret_token_here
```

### Admin Portal Access
- Open Admin Portal via JavaScript helper: `openAdminPortal('your_secure_admin_secret_token_here')`.
- Authenticates against `api/inquiry.js` using `Authorization: Bearer <token>`.
- Inquiries can be categorized across stages: `New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`.

---

## 5. Security & Privacy Compliance
- **No Secrets in Frontend**: Zero API keys, database credentials, or email passwords are stored in HTML/CSS/JS.
- **Privacy-Safe GA4 Events**: Tracks interaction events (`click_cta`, `submit_inquiry`, `filter_category`, `view_case_study`) without collecting PII (names, emails, phone numbers).
