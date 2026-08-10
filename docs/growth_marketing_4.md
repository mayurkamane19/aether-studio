# Aether Studio — Advanced Growth, Marketing & Conversion Engine 4.0 Architecture

This document details the Growth & Marketing Engine 4.0 system, Lead Attribution, UTM tracking, Campaign management, Funnel analytics, Marketing ROI calculation formulas, and Data Privacy rules for **Aether Studio**.

---

## 1. Growth & Marketing Engine Architecture

```
VISITOR TRAFFIC (UTM Parameters & HTTP Referrer Capture)
                           │
                           ▼
          CONTACT FORM ENGINE (api/contact.js & lead_attributions)
          ├── LEAD SCORING 4.0 (0-100 Range / High-Intent Detection)
          ├── FUNNEL ANALYTICS (Visitor -> Lead -> Qualified -> Proposal -> Won)
          ├── EMAIL SEQUENCES & OPT-OUT SAFETY (Automated Sequence Control)
          ├── MARKETING EXPERIMENTS & A/B TESTING (marketing_experiments)
          └── MARKETING ROI & ATTRIBUTED REVENUE (Revenue - Cost Calculation)
```

---

## 2. Financial & Marketing Metric Lineage

- **Marketing ROI Formula**: Calculated as $\text{ROI} = \frac{\text{Revenue} - \text{Cost}}{\text{Cost}} \times 100\%$. If campaign cost data is not configured or unavailable, ROI displays `N/A` instead of assuming zero cost.
- **Funnel Analytics Lineage**: Stages are tracked through empirical database transition events (`Visitor` -> `Inquiry` -> `Lead` -> `Qualified` -> `Proposal` -> `Won`).

---

## 3. Data Privacy & Opt-Out Safety

- **Communication Opt-Out Enforcement**: Automated email sequences immediately halt if a lead unsubscribes, replies to an email, or converts to a client.
- **No Unrestricted Public Access**: Marketing dashboards and campaign management endpoints are protected by `ADMIN_CRM_TOKEN`.
