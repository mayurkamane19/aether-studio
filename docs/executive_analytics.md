# Aether Studio — Executive Command Center & Business Intelligence Architecture

This document details the Executive Command Center architecture, KPI calculations, revenue formulas ($\text{Paid Revenue} \neq \text{Invoiced Total}$), sales conversion funnels, AI risk detection, and forecasting models for **Aether Studio**.

---

## 1. Executive KPI Taxonomy & Calculation Formulas

| KPI Indicator | Calculation Formula | Data Source | Safety & Division-by-Zero Protection |
| :--- | :--- | :--- | :--- |
| **Total Paid Revenue** | $\sum \text{amount\_paid}$ from `invoices` | PostgreSQL `invoices` | Excludes pending/unpaid invoices |
| **Outstanding Invoices** | $\sum (\text{total\_amount} - \text{amount\_paid})$ (`status = PENDING`) | PostgreSQL `invoices` | Real-time calculation |
| **Overdue Amount** | $\sum (\text{total\_amount} - \text{amount\_paid})$ (`status = OVERDUE`) | PostgreSQL `invoices` | Real-time calculation |
| **Lead Conversion Rate** | $\frac{\text{Won Leads}}{\text{Total Leads}} \times 100$ | PostgreSQL `leads` | Handled safely: $0\%$ if Total Leads $= 0$ |
| **Stage Conversion** | $\frac{\text{Stage } N+1 \text{ Count}}{\text{Stage } N \text{ Count}} \times 100$ | PostgreSQL `leads` | Handled safely: $0\%$ if Denominator $= 0$ |

---

## 2. Statistical Forecasting Model

$$\text{Predicted 30-Day Revenue} = \text{Verified Won Revenue} + (\text{Weighted Pipeline Value} \times 0.40)$$

- **Labeling Mandate**: All predicted revenue and pipeline forecasts are explicitly tagged with `type: "FORECAST"` in API responses and UI dashboards. Predictions are NEVER presented as guaranteed database facts.

---

## 3. Serverless API Endpoint (`/api/admin/analytics`)

Protected by `ADMIN_CRM_TOKEN`:
- `GET /api/admin/analytics`: Returns real-time Executive KPIs, revenue stats, conversion funnels, top opportunities, pipeline valuations, and statistical forecasts.
- `GET /api/admin/analytics?exportCSV=true`: Generates an administrative CSV business intelligence report formatted safely without formula injection vectors.
