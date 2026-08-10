-- AETHER STUDIO — CRM PHASE 35 MIGRATION: AI CLIENT & BUSINESS AUTOMATION 5.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS ai_automation_rules (
  id SERIAL PRIMARY KEY,
  rule_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  requires_approval BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aar_status ON ai_automation_rules(status);
