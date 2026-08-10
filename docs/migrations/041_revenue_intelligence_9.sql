-- AETHER STUDIO — CRM PHASE 41 MIGRATION: PRODUCT GROWTH, MONETIZATION & REVENUE INTELLIGENCE 9.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS revenue_goals (
  id SERIAL PRIMARY KEY,
  goal_id VARCHAR(50) UNIQUE NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'MONTHLY', 'QUARTERLY', 'ANNUAL'
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rg_period ON revenue_goals(period);
