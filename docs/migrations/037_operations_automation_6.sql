-- AETHER STUDIO — CRM PHASE 37 MIGRATION: INTELLIGENT OPERATIONS & WORKFLOW AUTOMATION 6.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS workflow_execution_logs (
  id SERIAL PRIMARY KEY,
  execution_id VARCHAR(50) UNIQUE NOT NULL,
  workflow_id VARCHAR(50) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'SUCCESS',
  error_details TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wel_wfid ON workflow_execution_logs(workflow_id);
