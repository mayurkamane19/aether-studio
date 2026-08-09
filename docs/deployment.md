# Aether Studio — Automated CI/CD, Deployment & Rollback Protocol

This document details the automated CI/CD pipeline, GitHub Actions workflow, Vercel Git integration, rollback procedures, and deployment verification specs for **Aether Studio**.

---

## 1. CI/CD Architecture Overview

Aether Studio uses an automated GitHub Actions Quality Gate connected to Vercel Git deployments.

```
Local Code / Feature Branch
       │
       ▼
Git Push / Pull Request to main
       │
       ▼
GitHub Actions CI Quality Gate (.github/workflows/ci.yml)
 ├── 1. Install Dependencies (npm ci)
 ├── 2. Syntax Check (JS Files, API Routes, lib/db.js)
 ├── 3. Secret Scan Audit (Detect hardcoded keys)
 └── 4. QA Test Suite Execution (npm test)
       │
       ▼ (Passed)
Vercel Production Deployment (Automatic)
```

---

## 2. Vercel Rollback & Recovery Procedures

If a deployment issue occurs in production:
1. **Inspect Vercel Logs**: Open **Vercel Dashboard → Deployments** and inspect Function Logs for errors.
2. **Instant Vercel Rollback**: Navigate to **Deployments → Instant Rollback**, select the previous known good deployment (e.g. commit hash), and click **Promote to Production**.
3. **Revert Git Commit**:
   ```bash
   git revert HEAD
   git push origin main
   ```
4. **Production Health Verification**: Execute `curl -i https://aetherstudio.com/api/health` and verify `status: "ok"` and `database: "healthy"`.

---

## 3. Release Checklist & Deployment Verification

- [x] Syntax validation passed (`npm run syntax-check`).
- [x] Platform QA test suite passed (`npm test`).
- [x] Secret scan passed (Zero hardcoded credentials).
- [x] Inbound contact form operational (`POST /api/contact`).
- [x] Secure Client Portal operational (`/portal.html?token=...`).
- [x] Production health endpoint responsive (`/api/health`).
