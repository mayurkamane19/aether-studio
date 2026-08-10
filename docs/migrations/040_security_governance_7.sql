-- AETHER STUDIO — CRM PHASE 40 MIGRATION: ENTERPRISE SECURITY, GOVERNANCE & COMPLIANCE 7.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS security_incidents (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(20) DEFAULT 'MEDIUM',
  owner VARCHAR(100) DEFAULT 'Security Team',
  status VARCHAR(50) DEFAULT 'OPEN',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_si_status ON security_incidents(status);
