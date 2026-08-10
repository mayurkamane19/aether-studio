# Aether Studio — Automation & Workflow Engine Architecture

This document details the Event-Driven Automation Architecture, Condition Engine, Idempotency Safeguards, Action Execution, Retries, Dead-Letter queues, and AI Workflow Generation for **Aether Studio**.

---

## 1. Event-Driven Workflow Architecture

```
Internal State Change (e.g. LEAD_CREATED, PROPOSAL_APPROVED, INVOICE_OVERDUE)
                                │
                                ▼
         emitEvent(eventType, entityType, entityId, payload)
                                │
                                ▼
        Idempotency Check (idempotency_key: WF-ID-EVT-ID)
       ├── Duplicate Detected -> Exit Gracefully
       └── Unique -> Evaluate Allowlisted Conditions
                                │
                                ▼
         Condition Engine (No eval(), Safe Operators)
       ├── Conditions Failed -> Exit Logged
       └── All Passed -> Execute Permitted Actions
                                │
                                ▼
        Action Execution (CREATE_TASK, NOTIFY, LOG_ACTIVITY)
                                │
                                ▼
       Workflow Run Record (workflow_runs -> status: COMPLETED)
```

---

## 2. Condition Evaluation Safety Directives

- **Allowlisted Operators Only**: Conditions are evaluated strictly via `evaluateCondition()` using operators: `equals`, `not_equals`, `greater_than`, `less_than`, `contains`, `in`.
- **Zero String `eval()`**: The engine NEVER invokes `eval()`, `new Function()`, or dynamic JavaScript strings from database inputs.

---

## 3. High-Risk Action Prohibition

- **Forbidden Automatic Actions**: The workflow engine is strictly forbidden from automatically deleting database records, deleting files, modifying user security permissions, altering bank credentials, or refunding payments. High-risk operations require explicit human admin approval.
