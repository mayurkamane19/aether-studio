-- AETHER STUDIO — CRM PHASE 10 MIGRATION: REVENUE TARGETS & BUSINESS INTELLIGENCE
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS business_targets (
  id SERIAL PRIMARY KEY,
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  target_value INT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_period_target UNIQUE (period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_targets_period ON business_targets(period_type, period_start);
