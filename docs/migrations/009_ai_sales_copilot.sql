-- AETHER STUDIO — CRM PHASE 9 MIGRATION: AI SALES COPILOT RECOMMENDATIONS HISTORY
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS lead_copilot_recommendations (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  confidence VARCHAR(50) NOT NULL,
  deal_health VARCHAR(50) NOT NULL,
  reason TEXT,
  summary TEXT,
  risk_data JSONB,
  missing_information JSONB,
  suggested_reply TEXT,
  suggested_followup TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_lead_id ON lead_copilot_recommendations(lead_id);
