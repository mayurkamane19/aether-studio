-- AETHER STUDIO — CRM PHASE 18 MIGRATION: CLIENT PORTAL 2.0 & COLLABORATION HUB
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS client_deliverables (
  id SERIAL PRIMARY KEY,
  deliverable_id VARCHAR(50) UNIQUE NOT NULL,
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE CASCADE,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT 'v1.0',
  file_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'IN_REVIEW',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliv_proj ON client_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliv_lead ON client_deliverables(lead_id);

CREATE TABLE IF NOT EXISTS client_feedback (
  id SERIAL PRIMARY KEY,
  deliverable_id VARCHAR(50) REFERENCES client_deliverables(deliverable_id) ON DELETE CASCADE,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE CASCADE,
  rating INT DEFAULT 5,
  feedback_type VARCHAR(50) DEFAULT 'APPROVAL',
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_deliv ON client_feedback(deliverable_id);

CREATE TABLE IF NOT EXISTS client_tickets (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tkt_lead ON client_tickets(lead_id);

CREATE TABLE IF NOT EXISTS client_ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL REFERENCES client_tickets(ticket_id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tkt_msg ON client_ticket_messages(ticket_id);
