# Aether Studio — Release Quality Checklist

Use this checklist before releasing code to production.

- [ ] **Git Working Tree**: Clean working tree (`git status` shows no uncommitted files).
- [ ] **Automated QA Suite**: Executed `npm test` with 0 failures.
- [ ] **Syntax Checks**: Executed `npm run syntax-check` with 0 errors.
- [ ] **Secret Scan**: Verified zero API keys, DB strings, or tokens in source files or Git history.
- [ ] **Database Migrations**: Verified SQL migration scripts (001 through 014) executed safely.
- [ ] **API Security**: Verified `ADMIN_CRM_TOKEN` requirement on admin serverless endpoints.
- [ ] **Client Portal Security**: Verified SHA-256 token hashing and client data isolation.
- [ ] **Public Preloader**: Verified loader smooth progress 0% → 100%.
- [ ] **Production Health Endpoint**: Verified `GET /api/health` returns `status: "ok"`.
