-- AETHER STUDIO — CRM PHASE 26 MIGRATION: ADVANCED FINANCE & REVENUE OPERATIONS 2.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_id VARCHAR(50) UNIQUE NOT NULL,
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE SET NULL,
  category VARCHAR(50) DEFAULT 'OPERATIONS',
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'INR',
  vendor VARCHAR(100) DEFAULT 'Vendor',
  expense_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'APPROVED',
  created_by VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exp_proj ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_exp_cat ON expenses(category);

CREATE TABLE IF NOT EXISTS payment_plans (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(50) UNIQUE NOT NULL,
  invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  milestone_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pay_plan_inv ON payment_plans(invoice_id);
