-- AETHER STUDIO — CRM PHASE 11 MIGRATION: SECURE CLIENT PORTAL & PROJECT EXPERIENCE
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS client_portals (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_portals_lead_id ON client_portals(lead_id);
CREATE INDEX IF NOT EXISTS idx_client_portals_token_hash ON client_portals(token_hash);

CREATE TABLE IF NOT EXISTS project_milestones (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_lead_id ON project_milestones(lead_id);

CREATE TABLE IF NOT EXISTS project_updates (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_updates_lead_id ON project_updates(lead_id);

CREATE TABLE IF NOT EXISTS client_messages (
  id SERIAL PRIMARY KEY,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON client_messages(lead_id);
