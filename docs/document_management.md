# Aether Studio — Document Management & File Storage Architecture

This document details the Document Management system, file classification, visibility tiers (`INTERNAL`, `CLIENT_VISIBLE`, `ADMIN_ONLY`), file sanitization rules, and versioning graphs for **Aether Studio**.

---

## 1. Document Taxonomy & Visibility Tiers

- **Document Categories**: `PROPOSAL`, `CONTRACT`, `SCOPE`, `INVOICE`, `RECEIPT`, `DELIVERABLE`, `DESIGN`, `REPORT`, `BRIEF`, `MEETING`, `PROJECT`, `LEGAL`, `MARKETING`, `OTHER`.
- **Visibility Levels**:
  - `INTERNAL`: Internal agency team members (Project Managers, Developers, Designers).
  - `CLIENT_VISIBLE`: Explicitly shared with the authenticated client via secure Client Portal.
  - `ADMIN_ONLY`: Strictly restricted to Agency Owners and Admins (Financial agreements, internal legal audits).

---

## 2. Serverless API Reference (`/api/admin/documents`)

Protected by `ADMIN_CRM_TOKEN`:
- `GET /api/admin/documents`: Returns document metadata filtered by Lead ID, Project ID, or Visibility.
- `POST /api/admin/documents`: Registers document uploads (`REGISTER_DOCUMENT`), creates version tags (`CREATE_VERSION`), issues document requests (`REQUEST_DOCUMENT`), and generates short-lived signed download URLs (`GENERATE_DOWNLOAD_LINK`).
