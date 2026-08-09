-- AETHER STUDIO — CRM PHASE 12 MIGRATION: INVOICING, PAYMENTS & FINANCIAL MANAGEMENT
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  proposal_id VARCHAR(50) REFERENCES proposals(proposal_id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'DRAFT',
  currency VARCHAR(10) DEFAULT 'INR',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_invoice_id ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_reference VARCHAR(100) UNIQUE NOT NULL,
  provider VARCHAR(50) DEFAULT 'MANUAL',
  status VARCHAR(50) DEFAULT 'PENDING',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_method VARCHAR(50) DEFAULT 'CARD',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(payment_reference);

CREATE TABLE IF NOT EXISTS credit_notes (
  id SERIAL PRIMARY KEY,
  credit_note_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'ISSUED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cn_invoice_id ON credit_notes(invoice_id);
