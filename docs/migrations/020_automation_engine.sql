-- AETHER STUDIO — CRM PHASE 20 MIGRATION: AUTOMATION & WORKFLOW ENGINE
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL,
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_by VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wf_trigger ON workflow_definitions(trigger_event);

CREATE TABLE IF NOT EXISTS workflow_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(50) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_type ON workflow_events(event_type);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(50) UNIQUE NOT NULL,
  workflow_id VARCHAR(50) NOT NULL REFERENCES workflow_definitions(workflow_id) ON DELETE CASCADE,
  event_id VARCHAR(50) NOT NULL REFERENCES workflow_events(event_id) ON DELETE CASCADE,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'COMPLETED',
  logs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_run_wf ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_run_idem ON workflow_runs(idempotency_key);
