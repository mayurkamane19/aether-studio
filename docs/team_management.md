# Aether Studio — Team Management & Role Permissions

This document details the internal Team Management architecture, role permissions, workload calculations, capacity management, and security constraints for **Aether Studio**.

---

## 1. Team Architecture & Role Matrix

| Role Name | Access Scope | Lead Mgmt | Financials | AI Approvals | Team Admin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OWNER` | Full Agency Administration | Full Access | Full Access | Full Access | Full Access |
| `ADMIN` | Agency Operations Manager | Full Access | Full Access | Full Access | Full Access |
| `PROJECT_MANAGER` | Project & Task Operations | View & Edit | View Only | View & Suggest | View Team |
| `SALES` | CRM Pipeline & Proposals | View & Edit | View Proposals | View & Suggest | Restricted |
| `DEVELOPER` | Assigned Tasks & Milestones | View Assigned | Restricted | View Only | Restricted |
| `DESIGNER` | Assigned Tasks & Deliverables | View Assigned | Restricted | View Only | Restricted |
| `FINANCE` | Invoicing & Payment Verification | View Leads | Full Access | View Only | Restricted |

---

## 2. Workload & Capacity Calculation

$$\text{Current Workload \%} = \frac{\text{Assigned Open Task Hours}}{\text{Configured Weekly Capacity (40h)}} \times 100$$

- **Workload Classifications**:
  - `LOW`: Workload < 50%
  - `NORMAL`: Workload 50% – 85%
  - `HIGH`: Workload 85% – 100%
  - `OVERLOADED`: Workload > 100%

---

## 3. Serverless API Reference (`/api/admin/operations`)

Protected by `ADMIN_CRM_TOKEN`:
- `GET /api/admin/operations`: Returns team members, active projects, tasks, and workload metrics.
- `POST /api/admin/operations`: Manages team creation (`CREATE_TEAM_MEMBER`), task assignment, and time tracking.
