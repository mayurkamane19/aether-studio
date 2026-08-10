# Aether Studio — Resource & Capacity Planning Architecture

This document details the Resource Capacity calculation formulas, Overbooking Detection algorithm, task dependency graph validation, and AI Scheduling Assistance for **Aether Studio**.

---

## 1. Resource Capacity & Operational Utilization Formula

$$\text{Resource Utilization \%} = \frac{\text{Scheduled Task Hours} + \text{Scheduled Meeting Hours}}{\text{Available Member Capacity (40h/week)}} \times 100$$

- **Overbooking Threshold**: When total scheduled hours for a team member exceed 40 hours in a given week, the system flags the member as `OVERBOOKED`.
- **Recommendation Guarantee**: Overbooking alerts and AI scheduling recommendations are advisory-only. The system will NEVER automatically reschedule meetings or reassign tasks without explicit human admin confirmation.

---

## 2. Task Dependency DAG Validation

- **Self-Dependency Check**: Prevented via database check constraint `chk_no_self_dependency` (`task_id <> depends_on_task_id`).
- **Circular Dependency Guard**: Server-side API validates that Task A cannot depend on Task B if Task B already transitively depends on Task A.

---

## 3. Database Schema

Managed via safe migration [`docs/migrations/017_calendar_resource_planning.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/017_calendar_resource_planning.sql):

1. **`calendar_events`**: `id`, `event_id`, `title`, `description`, `event_type`, `project_id`, `lead_id`, `task_id`, `assigned_to`, `start_time`, `end_time`, `all_day`, `location`, `meeting_url`, `status`.
2. **`meetings`**: `id`, `meeting_id`, `title`, `client_name`, `client_email`, `lead_id`, `project_id`, `start_time`, `end_time`, `meeting_url`, `agenda`, `notes`, `status`.
3. **`task_dependencies`**: `id`, `task_id`, `depends_on_task_id`.
