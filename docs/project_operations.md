# Aether Studio — Project Operations & Task Management

This document details the Project Operations lifecycle, Task Kanban states, project progress formulas, scope creep integration, and audit logging for **Aether Studio**.

---

## 1. Project Lifecycle & Task Kanban States

- **Project Statuses**: `PLANNING` -> `IN_PROGRESS` -> `REVIEW` -> `COMPLETED` (or `ON_HOLD` / `CANCELLED`).
- **Task Kanban Columns**:
  1. `TODO`: Backlog tasks assigned to project members.
  2. `IN_PROGRESS`: Tasks currently undergoing engineering or design.
  3. `BLOCKED`: Tasks waiting for client inputs or external dependencies.
  4. `REVIEW`: Tasks completed by members awaiting PM review.
  5. `DONE`: Verified completed tasks.

---

## 2. Project Progress Calculation Formula

$$\text{Project Progress \%} = \frac{\text{Completed Tasks Count} + \text{Completed Milestones Count}}{\text{Total Tasks Count} + \text{Total Milestones Count}} \times 100$$

- **Data Guarantee**: Progress is derived strictly from real database records. If no tasks exist, progress defaults to `0%`.

---

## 3. Database Schema

Managed via safe, idempotent migration [`docs/migrations/016_team_project_operations.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/016_team_project_operations.sql):

1. **`team_members`**: `id`, `member_id`, `name`, `email`, `role`, `department`, `status`.
2. **`projects`**: `id`, `project_id`, `project_name`, `lead_id`, `proposal_id`, `client_name`, `client_email`, `status`, `priority`, `description`, `budget`, `assigned_manager`, `start_date`, `target_date`.
3. **`tasks`**: `id`, `task_id`, `project_id`, `title`, `description`, `assigned_to`, `created_by`, `status`, `priority`, `due_date`, `estimated_hours`, `actual_hours`.
4. **`task_comments`**: `id`, `task_id`, `author`, `message`, `created_at`.
5. **`time_entries`**: `id`, `task_id`, `user_name`, `duration_hours`, `notes`, `logged_at`.
