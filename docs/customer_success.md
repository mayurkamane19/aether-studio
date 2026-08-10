# Aether Studio — Advanced Customer Success, Retention & Client Lifecycle 2.0 Architecture

This document details the Customer Success 2.0 system, Health Score calculation algorithms (0-100 range), CSAT & NPS formulas, Renewal pipeline management, and Client Isolation directives for **Aether Studio**.

---

## 1. Customer Success & Lifecycle Architecture

```
LEAD -> CLIENT -> ONBOARDING -> PROJECT -> DELIVERY -> APPROVAL -> PAYMENT
                                                                   │
                                                                   ▼
                                                  CLIENT SUCCESS WORKSPACE
                                                  ├── HEALTH SCORES (0-100 Range / SYSTEM GENERATED)
                                                  ├── RENEWAL MANAGEMENT (UPCOMING -> IN_DISCUSSION -> RENEWED)
                                                  ├── FEEDBACK & CSAT/NPS AGGREGATION
                                                  └── RETENTION & UPSELL RECOMMENDATIONS
```

---

## 2. Client Health Scoring & Risk Signals

- **Health Score Formula**: Calculates server-side scores (`0-100`) based on active project status, invoice payment timeliness (subtracts 15 points per overdue invoice), and support ticket resolution (subtracts 5 points per open ticket).
- **Health Status Categorization**:
  - `85 - 100`: `HEALTHY`
  - `70 - 84`: `WATCH`
  - `50 - 69`: `AT_RISK`
  - `0 - 49`: `CRITICAL`
- **Label Requirement**: All client health scores are explicitly labeled as `SYSTEM GENERATED`.

---

## 3. Strict Client Data Privacy

- **Internal Health & Churn Protection**: Internal client health scores, churn risks, upsell strategies, agency retention notes, and AI health analyses are **STRICTLY EXCLUDED** from Client Portal views.
- **Client Portal Boundaries**: Authenticated clients only view client-safe project deliverables, support ticket status, and feedback submission forms.
