-- AETHER STUDIO — CRM PHASE 15 MIGRATION: AI AGENCY OPERATING SYSTEM & SUGGESTED ACTIONS
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS ai_agency_actions (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'SALES',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  payload JSONB,
  priority VARCHAR(50) DEFAULT 'NORMAL',
  confidence VARCHAR(50) DEFAULT 'HIGH',
  status VARCHAR(50) DEFAULT 'SUGGESTED',
  approved_by VARCHAR(100),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_actions_lead_id ON ai_agency_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_status ON ai_agency_actions(status);

CREATE TABLE IF NOT EXISTS ai_insights_cache (
  id SERIAL PRIMARY KEY,
  insight_key VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_key ON ai_insights_cache(insight_key);
