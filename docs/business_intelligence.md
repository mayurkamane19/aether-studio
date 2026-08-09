# Aether Studio — Advanced Business Intelligence & Revenue Intelligence

This document details the Executive Business Intelligence Dashboard architecture, metric definitions, revenue calculation formulas, revenue forecast methodology, lost deal analytics, target progress rules, and security model for **Aether Studio**.

---

## 1. Executive Business Intelligence Dashboard Overview

The Business Intelligence engine aggregates real PostgreSQL lead records, proposal contract values, conversion timestamps, and follow-up states to present executive revenue metrics, pipeline values, and growth comparisons.

### Core Calculation Principles
- **Real Database Data Only**: All metrics, revenue sums, conversion rates, and forecasts are derived directly from actual PostgreSQL records. **Zero fake data or fabricated numbers.**
- **Safe Zero/Empty State Fallbacks**: If a denominator is 0 or no records match a filter, the dashboard returns `"N/A"`, `"No data available yet"`, or `"No won revenue yet"`.
- **Public Isolation**: Analytics queries run strictly on protected serverless routes (`/api/admin/analytics`). The public homepage operates independently.

---

## 2. Metric Definitions & Formulas

| Metric Name | Calculation / Formula | SQL Source / Logic |
| :--- | :--- | :--- |
| **Won Revenue** | $\sum \text{final\_value}$ WHERE status = `'WON'` | `proposals.total` or `leads.final_value` for `WON` leads |
| **Open Pipeline** | $\sum \text{estimated\_value}$ WHERE status NOT IN (`'WON'`, `'LOST'`) | Active opportunities in `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION` |
| **Weighted Pipeline** | $\sum (\text{estimated\_value} \times \text{stage\_probability})$ | Deterministic probabilities: `NEW` (10%), `CONTACTED` (20%), `QUALIFIED` (40%), `PROPOSAL_SENT` (60%), `NEGOTIATION` (80%), `WON` (100%), `LOST` (0%) |
| **Average Deal Value** | $\frac{\text{Total Won Revenue}}{\text{Number of Won Deals}}$ | Returns `"N/A"` if Won Deals count = 0 |
| **Average Sales Cycle** | $\text{AVG}(\text{won\_at} - \text{created\_at})$ | Calculated in fractional days from creation to close |
| **Proposal View Rate** | $\frac{\text{Proposals Viewed}}{\text{Proposals Sent}}$ | Calculated from `proposals` table timestamps |
| **Proposal Acceptance Rate** | $\frac{\text{Proposals Accepted}}{\text{Total Proposals}}$ | Calculated from `proposals.status = 'ACCEPTED'` |

---

## 3. Revenue Forecast Methodology

$$\text{Estimated Revenue Forecast} = \text{Historical Average Monthly Won Revenue} + \text{Current Open Weighted Pipeline}$$

- **Transparency Guarantee**: The forecast is explicitly labeled *"Estimated Revenue Forecast"*. It does NOT pretend predictive certainty or claim guaranteed sales.
- **Data Prerequisite**: If historical data is less than 30 days old or contains zero won deals, the system displays: `"Forecast unavailable — more historical data required."`

---

## 4. Month-over-Month (MoM) Growth Formulas

$$\text{Growth \%} = \frac{\text{Current Month Revenue} - \text{Previous Month Revenue}}{\text{Previous Month Revenue}} \times 100$$

- If Previous Month Revenue = 0, the dashboard displays **`"N/A"`** to avoid misleading infinite percentages.

---

## 5. Revenue Targets & Progress Alerts

Admin can define monthly, quarterly, or annual targets stored in `business_targets`:
- **Achievement %**: $\frac{\text{Actual Won Revenue}}{\text{Target Value}} \times 100$
- **Target Gap Alert Statuses**:
  - `Ahead of Target`: Actual Revenue > Expected Date Progress %
  - `On Track`: Actual Revenue within 10% of Date Progress %
  - `Behind Target`: Actual Revenue < Expected Date Progress %
  - `No Target Configured`: Rendered when no target has been set for the period.

---

## 6. Serverless API Endpoint (`GET /api/admin/analytics`)

Protected by `ADMIN_CRM_TOKEN`. Accepts query parameters:
- `range`: `7D`, `30D`, `90D`, `12M`, `ALL`
- `statusFilter`: Status enum filter
- `projectTypeFilter`: Project type string filter
- `exportCSV`: Set to `true` to download a CSV business report.
