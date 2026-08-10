# Aether Studio — Advanced Finance, Billing & Revenue Operations 2.0 Architecture

This document details the Finance Operations 2.0 system, Invoice calculation formulas ($\text{Total} = \text{Subtotal} - \text{Discount} + \text{Tax}$), Receivables Aging taxonomy, Payment Webhook verification, Expense Approval workflows, and Client Isolation directives for **Aether Studio**.

---

## 1. Finance & Billing Architecture

```
LEAD (AS-2026-0001)
├── PROPOSAL (PRP-2026-0001)
├── PROJECT (PRJ-2026-0001)
├── INVOICE (AS-INV-2026-0001)
│   ├── INVOICE ITEMS (Description, Qty, Unit Price)
│   ├── SERVER-SIDE TOTALS (Subtotal - Discount + Tax)
│   └── PAYMENT PLANS (Deposit, Milestone 1, Final)
├── VERIFIED PAYMENTS (Stripe / Razorpay Webhooks)
├── EXPENSES (Software, Hosting, Contractors)
└── REVENUE & CASH FLOW ANALYTICS (Collected vs Receivables Aging)
```

---

## 2. Server-Side Financial Integrity & Webhook Security

- **Server-Side Financial Formulas**: Invoice subtotals, tax rates, percentage/flat discounts, and final due balances are calculated strictly on the backend. Frontend calculated totals are NEVER trusted.
- **Webhook Verification**: Payment provider webhooks (Stripe / Razorpay) require verified cryptographically signed headers (`stripe-signature`, `x-razorpay-signature`) and enforce idempotency using payment event IDs.

---

## 3. Strict Financial Data Isolation

- **Internal Profit & Expense Protection**: Internal project margins, team salaries, contractor payouts, expense categories, and agency cash flow forecasts are **STRICTLY EXCLUDED** from Client Portal views.
- **Client Financial View**: Authenticated clients only view their own client-specific invoices, verified payment receipts, and balance due.
