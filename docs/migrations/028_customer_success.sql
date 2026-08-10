-- AETHER STUDIO — CRM PHASE 28 MIGRATION: ADVANCED CUSTOMER SUCCESS, RETENTION & CLIENT LIFECYCLE 2.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS client_health_scores (
  id SERIAL PRIMARY KEY,
  score_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  health_score INT NOT NULL DEFAULT 85,
  status VARCHAR(50) DEFAULT 'HEALTHY',
  reason TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chs_lead ON client_health_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_chs_status ON client_health_scores(status);

CREATE TABLE IF NOT EXISTS client_renewals (
  id SERIAL PRIMARY KEY,
  renewal_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  renewal_date DATE NOT NULL,
  renewal_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'UPCOMING',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rnw_lead ON client_renewals(lead_id);
CREATE INDEX IF NOT EXISTS idx_rnw_status ON client_renewals(status);
