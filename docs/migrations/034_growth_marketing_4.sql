-- AETHER STUDIO — CRM PHASE 34 MIGRATION: ADVANCED GROWTH, MARKETING & CONVERSION ENGINE 4.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS marketing_experiments (
  id SERIAL PRIMARY KEY,
  exp_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  variant_a VARCHAR(100) NOT NULL,
  variant_b VARCHAR(100) NOT NULL,
  conversion_a INT DEFAULT 0,
  conversion_b INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_me_status ON marketing_experiments(status);
