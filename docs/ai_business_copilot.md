# Aether Studio — AI Business Copilot 2.0 Architecture

This document details the AI Business Copilot 2.0 system, Intent Taxonomy, Allowlisted Tool Schemas, Prompt Injection Protections, Human-in-the-loop Action Approvals, and Data Isolation Rules for **Aether Studio**.

---

## 1. Copilot Processing Architecture

```
User Query ("What is my revenue this month?")
                     │
                     ▼
          Admin Authentication & Token Verification (ADMIN_CRM_TOKEN)
                     │
                     ▼
       Intent Classification (REVENUE, SALES, INVOICES, FORECAST)
                     │
                     ▼
  Allowlisted Server-Side Data Tools (No Arbitrary SQL / No eval())
                     │
                     ▼
       Prompt Injection Defense (Sanitizes user/document text)
                     │
                     ▼
   Structured Response Output + Metric Sources + Action Proposal
                     │
                     ▼
     Human Approval Workflow (Explicit APPROVE / REJECT Buttons)
```

---

## 2. Intent Taxonomy & Data Tools

| Intent Category | Intent Trigger Keywords | Safe Allowlisted Data Tool | Source Verification |
| :--- | :--- | :--- | :--- |
| `REVENUE` | revenue, paid, earned | `getRevenueMetrics()` | PostgreSQL `invoices` table |
| `SALES` | lead, funnel, conversion | `getSalesMetrics()` | PostgreSQL `leads` & pipeline |
| `INVOICES` | invoice, overdue, pending | `getInvoiceMetrics()` | PostgreSQL `invoices` table |
| `FORECAST` | forecast, prediction | `getForecast()` | Statistical Forecasting Engine |
| `EXECUTIVE_BRIEFING` | summary, briefing | `generateExecutiveSummary()` | PostgreSQL CRM Aggregate |

---

## 3. High-Risk Action Prohibitions

- **Human Approval Mandate**: AI Copilot CANNOT automatically modify PostgreSQL status, delete documents, refund payments, issue credits, change permissions, or send emails. Suggested actions present explicit `APPROVE` and `REJECT` buttons for human admin evaluation.
- **Zero Arbitrary Execution**: The model is strictly prohibited from generating raw SQL strings, running `eval()`, or invoking shell commands.
