-- AETHER STUDIO — CRM PHASE 33 MIGRATION: ADVANCED CLIENT EXPERIENCE & SELF-SERVICE 4.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS client_onboarding (
  id SERIAL PRIMARY KEY,
  onboarding_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  company_info JSONB,
  project_goals TEXT,
  completed_steps INT DEFAULT 0,
  total_steps INT DEFAULT 5,
  status VARCHAR(50) DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_lead ON client_onboarding(lead_id);
