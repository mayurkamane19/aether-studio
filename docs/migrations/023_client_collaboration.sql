-- AETHER STUDIO — CRM PHASE 23 MIGRATION: CLIENT EXPERIENCE 3.0 & COLLABORATION HUB
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS client_notifications (
  id SERIAL PRIMARY KEY,
  notification_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'PROJECT',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cnotif_lead ON client_notifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_cnotif_read ON client_notifications(is_read);

CREATE TABLE IF NOT EXISTS client_change_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE SET NULL,
  deliverable_id VARCHAR(50) REFERENCES client_deliverables(deliverable_id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chg_req_lead ON client_change_requests(lead_id);

CREATE TABLE IF NOT EXISTS client_activity_logs (
  id SERIAL PRIMARY KEY,
  log_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cact_lead ON client_activity_logs(lead_id);
