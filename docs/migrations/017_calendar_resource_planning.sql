-- AETHER STUDIO — CRM PHASE 17 MIGRATION: CALENDAR, SCHEDULING & RESOURCE PLANNING
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'MEETING',
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE CASCADE,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE SET NULL,
  task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE SET NULL,
  assigned_to VARCHAR(100) DEFAULT 'Engineering Team',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location VARCHAR(255) DEFAULT 'Online',
  meeting_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  created_by VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_start_end ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_cal_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cal_project_id ON calendar_events(project_id);

CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE SET NULL,
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_url VARCHAR(255),
  agenda TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_start ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  depends_on_task_id VARCHAR(50) NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dep ON task_dependencies(task_id, depends_on_task_id);
