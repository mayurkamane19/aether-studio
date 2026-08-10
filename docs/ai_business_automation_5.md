# Aether Studio — AI Client & Business Automation 5.0 Architecture

This document details the AI Business Automation 5.0 system, Natural Language Business Search, Structured Tool Calling Allowlist, Human Approval Gate, Prompt Injection Defenses, and Audit Controls for **Aether Studio**.

---

## 1. AI Business Automation Architecture

```
NATURAL LANGUAGE BUSINESS SEARCH / USER INQUIRIES
                          │
                          ▼
            AI AUTOMATION ENGINE (lib/ai_agency.js)
            ├── PREDEFINED TOOL CALLING ALLOWLIST (get_leads, get_projects, get_invoices)
            ├── LEAD TRIAGE & FOLLOW-UP DRAFTING (Advisory Output / Non-Blocking)
            ├── PROMPT INJECTION DEFENSE (System isolation wrappers)
            └── HUMAN APPROVAL GATE (ai_automation_rules / Sensitive action verification)
```

---

## 2. Structured Tool Calling Allowlist & Approval Gate

- **Predefined Operations**: Natural language user inquiries are converted into predefined application function calls (`get_leads`, `get_projects`, `get_invoices`, `get_tickets`, `get_reports`, `get_clients`). Raw SQL generation or `eval()` execution are STRICTLY PROHIBITED.
- **Human Approval Directive**: Write operations (such as sending bulk emails, modifying invoices, issuing refunds, or deleting records) require explicit human approval (`APPROVE` / `REJECT`) before execution.

---

## 3. Strict Prompt Injection Defense & Data Isolation

- **Prompt Sanitization**: Untrusted input inside client tickets, emails, or messages is encapsulated in system isolation containers to prevent instruction overrides or system prompt extraction.
- **Client AI Isolation**: Client AI sessions are strictly scoped to the authenticated lead ID (`leadId`). Client users can NEVER access another client's projects, invoices, tickets, or reports.
