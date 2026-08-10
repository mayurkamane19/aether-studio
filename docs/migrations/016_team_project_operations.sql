-- AETHER STUDIO — CRM PHASE 16 MIGRATION: TEAM MANAGEMENT & PROJECT OPERATIONS
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  member_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'PROJECT_MANAGER',
  department VARCHAR(100) DEFAULT 'Engineering',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE SET NULL,
  proposal_id VARCHAR(50) REFERENCES proposals(proposal_id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'PLANNING',
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  description TEXT,
  budget NUMERIC(12,2) DEFAULT 0.00,
  assigned_manager VARCHAR(100) DEFAULT 'Lead PM',
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) UNIQUE NOT NULL,
  project_id VARCHAR(50) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to VARCHAR(100) DEFAULT 'Engineering Team',
  created_by VARCHAR(100) DEFAULT 'Admin',
  status VARCHAR(50) DEFAULT 'TODO',
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  due_date DATE,
  estimated_hours NUMERIC(6,2) DEFAULT 0.00,
  actual_hours NUMERIC(6,2) DEFAULT 0.00,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON task_comments(task_id);

CREATE TABLE IF NOT EXISTS time_entries (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(50) NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  user_name VARCHAR(100) NOT NULL,
  duration_hours NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  logged_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_task_id ON time_entries(task_id);
