# Aether Studio — AI-Native Client Experience & Personalization 10.0 Architecture

This document details the Client Portal AI Assistant, Client Isolation boundaries, Qualitative Confidence indicators, Document/Project Q&A, and Anti-Exfiltration Shields for **Aether Studio**.

---

## 1. Client AI Experience Architecture

```
AUTHENTICATED CLIENT PORTAL USER (Client A)
                     │
                     ▼
       CLIENT AI ENGINE 10.0 (lib/ai_agency.js)
       ├── CLIENT ISOLATION CONTAINER (Strictly scoped to lead_id)
       ├── ALLOWLISTED CLIENT TOOLS (readProject, readTask, readInvoice, readDocument, readTicket)
       ├── QUALITATIVE CONFIDENCE INDICATORS (High confidence / Needs verification / Insufficient info)
       └── UNKNOWN QUESTION SAFEGUARD ("I don't have enough information to answer that.")
```

---

## 2. Qualitative Confidence & Citation Directives

- **Qualitative Confidence**: Responses state qualitative indicators (`High Confidence`, `Needs Verification`, or `Insufficient Information`). Fabricated numerical percentages are STRICTLY PROHIBITED.
- **Unknown Safeguard**: When data is missing, the assistant safely responds: *"I don't have enough information to answer that."*

---

## 3. Strict Client Privacy & IDOR Boundary

- **Client Isolation**: Client AI sessions inherit the authenticated client's scope (`leadId`). Client A can NEVER query Client B's projects, tasks, invoices, or tickets.
- **Internal Shield**: Client AI tools cannot access internal admin notes (`is_internal = TRUE`), team channels, staff salaries, profit margins, or server keys.
