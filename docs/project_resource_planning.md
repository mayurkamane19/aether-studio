# Aether Studio — Advanced Project Management & Resource Planning 2.0 Architecture

This document details the Project Management 2.0 system, Project Phases, Milestone tracking, Task Dependency validation (circular check), Team Resource Capacity calculations, Risk Registers, and Client Visibility rules for **Aether Studio**.

---

## 1. Project Management 2.0 Target Architecture

```
PROJECT (PRJ-2026-0001)
├── PROJECT PHASES (Discovery, Design, Development, Testing, Deployment)
├── MILESTONES (M1, M2, M3)
├── TASKS & TASK DEPENDENCIES (Parent Task -> Child Task [No Circular Loops])
├── TEAM MEMBERS & RESOURCE CAPACITY (Available Hours vs Assigned Workload)
├── TIME ENTRIES & ESTIMATE VS ACTUAL (Logged Hours, Variance Tracking)
├── PROJECT RISKS (Risk Score = Probability x Impact)
├── PROJECT BLOCKERS (OPEN -> IN_PROGRESS -> RESOLVED)
└── CLIENT VISIBILITY TIER (Client-Visible Deliverables Only / Internal Notes Hidden)
```

---

## 2. Dependency Validation & Circular Loop Protection

- **Circular Dependency Guard**: Server-side validation rejects task dependencies where `parentTaskId === childTaskId` or where an indirect circular dependency chain exists.
- **Dependency Types**: `BLOCKS` and `BLOCKED_BY`. Unlocking dependent tasks occurs automatically when parent tasks reach `COMPLETED` status.

---

## 3. Strict Team Privacy & Client Isolation

- **Salary & Employee Data Protection**: Team salaries, hourly billing rates, private employee feedback, internal cost formulas, and private resource planning metrics are **STRICTLY EXCLUDED** from Client Portal responses.
- **Client Visibility Filter**: Clients only view deliverables explicitly marked `CLIENT_VISIBLE`. Internal task notes, internal blockers, and private risk registers remain private to agency team members.
