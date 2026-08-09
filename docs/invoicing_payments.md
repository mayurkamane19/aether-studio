# Aether Studio — Invoicing, Payments & Financial Management

This document details the Invoicing & Payment System architecture, invoice numbering rules, decimal-safe financial math, database schema, client portal integration, and payment verification protocols for **Aether Studio**.

---

## 1. Invoicing & Financial Architecture

The Invoicing & Payment System connects accepted proposals and won opportunities directly to billing, client invoices, payment verification, and revenue analytics.

### Core Calculation & Financial Principles
- **Decimal-Safe Calculation**: Subtotals, discounts, tax, and balances are computed on the server using decimal-safe arithmetic. Frontend calculated totals are NEVER trusted.
- **Sequential Invoice Numbering**: Invoice numbers follow the format `AS-INV-2026-XXXX` generated server-side.
- **Unverified Payment Protection**: Invoices are marked `PAID` or `PARTIALLY_PAID` ONLY when payment is explicitly recorded and verified. Unverified payments or fake test status codes are NEVER accepted.
- **Client Data Isolation**: Clients can view ONLY invoices belonging to their authenticated portal session (`getClientPortalDataByToken`). Client A can NEVER query Client B invoices.

---

## 2. Calculation Math

$$\text{Subtotal} = \sum (\text{unit\_price} \times \text{quantity})$$

$$\text{Taxable Amount} = \max(0, \text{Subtotal} - \text{Discount})$$

$$\text{Tax Amount} = \frac{\text{Taxable Amount} \times \text{Tax Rate}}{100}$$

$$\text{Total Invoice Amount} = \text{Taxable Amount} + \text{Tax Amount}$$

$$\text{Amount Due} = \max(0, \text{Total Invoice Amount} - \text{Amount Paid})$$

---

## 3. Database Schema

Managed via safe, idempotent migration [`docs/migrations/012_invoicing.sql`](file:///c:/Users/mayur/OneDrive/Desktop/Mayur%20Creative%20Studio/docs/migrations/012_invoicing.sql):

1. **`invoices`**: `id`, `invoice_number`, `lead_id`, `proposal_id`, `client_name`, `client_email`, `company`, `status` (`DRAFT` | `SENT` | `PARTIALLY_PAID` | `PAID` | `OVERDUE` | `CANCELLED`), `currency`, `subtotal`, `discount`, `tax_rate`, `tax_amount`, `total_amount`, `amount_paid`, `amount_due`, `issue_date`, `due_date`, `notes`.
2. **`invoice_items`**: `id`, `invoice_id`, `description`, `quantity`, `unit_price`, `line_total`, `sort_order`.
3. **`payments`**: `id`, `invoice_id`, `payment_reference`, `provider`, `status` (`SUCCEEDED` | `FAILED`), `amount`, `currency`, `payment_method`, `paid_at`.
4. **`credit_notes`**: `id`, `credit_note_number`, `invoice_id`, `amount`, `reason`, `status`.

---

## 4. Serverless API Endpoint (`/api/admin/invoices`)

Protected by `ADMIN_CRM_TOKEN`:
- `GET /api/admin/invoices?leadId=...`: Fetches invoices and billing status for a lead.
- `POST /api/admin/invoices`: Creates a new invoice (`createInvoice`).
- `POST /api/admin/invoices` (`action: 'PAYMENT'`): Records verified payment transaction (`recordPayment`).
