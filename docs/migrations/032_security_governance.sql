-- AETHER STUDIO — CRM PHASE 32 MIGRATION: ADVANCED SECURITY, COMPLIANCE & GOVERNANCE 3.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(50) UNIQUE NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'MEDIUM',
  actor VARCHAR(100) DEFAULT 'System',
  ip_address VARCHAR(45) DEFAULT '127.0.0.1',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sec_evt_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_evt_sev ON security_events(severity);
