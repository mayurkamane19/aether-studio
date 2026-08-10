-- AETHER STUDIO — CRM PHASE 25 MIGRATION: ADVANCED PROJECT MANAGEMENT & RESOURCE PLANNING 2.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS project_phases (
  id SERIAL PRIMARY KEY,
  phase_id VARCHAR(50) UNIQUE NOT NULL,
  project_id VARCHAR(50) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'PLANNING',
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phase_proj ON project_phases(project_id);

CREATE TABLE IF NOT EXISTS project_risks (
  id SERIAL PRIMARY KEY,
  risk_id VARCHAR(50) UNIQUE NOT NULL,
  project_id VARCHAR(50) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  probability INT DEFAULT 3,
  impact INT DEFAULT 3,
  risk_score INT DEFAULT 9,
  status VARCHAR(50) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_proj ON project_risks(project_id);

CREATE TABLE IF NOT EXISTS project_blockers (
  id SERIAL PRIMARY KEY,
  blocker_id VARCHAR(50) UNIQUE NOT NULL,
  project_id VARCHAR(50) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blkr_proj ON project_blockers(project_id);
