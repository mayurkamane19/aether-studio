# Aether Studio — Enterprise Collaboration & Workspace 6.0 Architecture

This document details the Enterprise Workspace 6.0 system, Project & Team channels, Internal messaging, Threading, `@mentions`, Decision Logging, and Client Data Isolation for **Aether Studio**.

---

## 1. Enterprise Collaboration Architecture

```
AUTHENTICATED TEAM MEMBERS
            │
            ▼
ENTERPRISE WORKSPACE ENGINE 6.0 (api/admin/operations.js & lib/db.js)
├── TEAM CHANNELS & MESSAGING (workspace_messages / GENERAL, PROJECT, DESIGN)
├── INTERNAL THREADS & MENTIONS (@user notification triggers)
├── PROJECT WORKSPACE & TASK DISCUSSIONS (Internal project collaboration)
└── DECISION LOG & ACTION ITEMS (Decision tracking & task links)
```

---

## 2. Decision Log & Task Integration

- **Decision Logging**: Major project choices are logged to `decision_logs` (`Decision`, `Owner`, `Date`, `Project`, `Reason`, `Status`).
- **Action Items**: Meeting action items automatically generate tasks in the primary project task board without duplicating task storage tables.

---

## 3. Strict Client Data & Privacy Isolation

- **Internal Channel Protection**: Team workspace channels (`workspace_messages`), task discussions, decision logs, and internal staff threads are **STRICTLY EXCLUDED** from Client Portal views.
- **Client Boundary**: Clients access only client-visible deliverables, tickets, and official messages explicitly approved for client viewing.
