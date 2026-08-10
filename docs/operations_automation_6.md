# Aether Studio — Intelligent Operations & Workflow Automation 6.0 Architecture

This document details the Operations Automation 6.0 engine, Trigger & Condition evaluation standards, Action allowlists, Human Approval Gates, Test Simulation Mode, Idempotency guarantees, and Dead-Letter state handling for **Aether Studio**.

---

## 1. Intelligent Operations Architecture

```
SYSTEM EVENT TRIGGER (LEAD_CREATED, TASK_OVERDUE, INVOICE_OVERDUE, SLA_BREACH)
                               │
                               ▼
            WORKFLOW AUTOMATION ENGINE 6.0 (lib/workflows.js)
            ├── SAFE CONDITION EVALUATOR (No eval() / Strict parameter comparison)
            ├── ALLOWLISTED ACTION ENGINE (CREATE_TASK, SEND_NOTIFICATION, CREATE_FOLLOWUP)
            ├── HUMAN APPROVAL GATE (High-Risk actions: Bulk Email, Financial Updates)
            └── EXECUTION AUDIT & DEAD-LETTER QUEUE (workflow_execution_logs)
```

---

## 2. Safe Condition Evaluation & Action Allowlists

- **No Arbitrary Code Evaluation**: Workflow conditions evaluate strict mathematical and string comparisons only (`Equals`, `Contains`, `GreaterThan`, `LessThan`). Dynamic code evaluation (`eval()`, `new Function()`) is STRICTLY PROHIBITED.
- **Allowlisted Actions**: Supported automated actions include `CREATE_TASK`, `UPDATE_STATUS`, `SEND_NOTIFICATION`, `CREATE_FOLLOWUP`, and `DRAFT_EMAIL`.
- **Human Approval Gate**: Operations involving high-risk actions (bulk email sending, financial record modifications, permission alterations) require explicit Admin authorization before execution.

---

## 3. Idempotency & Dead-Letter Queue

- **Idempotent Execution**: Workflows track execution IDs (`execution_id`) to prevent duplicate executions for identical triggers.
- **Dead-Letter State**: Failed workflows enter a `FAILED` state after 3 bounded retries and emit an internal alert for administrator inspection.
