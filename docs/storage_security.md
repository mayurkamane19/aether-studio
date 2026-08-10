# Aether Studio — Storage Security & Path Traversal Safeguards

This document details the File Security directives, Executable extension blocking, Path Traversal defenses, SHA-256 Checksum integrity, and short-lived link generation for **Aether Studio**.

---

## 1. File Security & Extension Safeguards

- **Prohibited Executable Extensions**: `.exe`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.dll`, `.scr`, `.msi`, `.php`, `.js`, `.vbs`, `.py`, `.com`, `.jar`.
- **Path Traversal Protection**: Filenames are sanitized server-side via `sanitizeFilename()` to strip `../`, `..\`, null bytes, and control characters before constructing storage paths.
- **Git Repository Exclusion**: Uploaded files are handled strictly via serverless object storage key references and are **NEVER committed directly into the Git repository**.

---

## 2. Short-Lived Authorized Download Links

$$\text{Download Request} \xrightarrow{\text{Token Verification}} \text{HMAC-SHA256 Token (15-min expiry)} \xrightarrow{\text{GET /api/documents/download}}$$

- **Zero Exposed Storage Keys**: Storage bucket credentials (`STORAGE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) remain strictly server-side.
