-- AETHER STUDIO — CRM PHASE 19 MIGRATION: SECURE DOCUMENT MANAGEMENT & FILE STORAGE
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'DELIVERABLE',
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE SET NULL,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE SET NULL,
  deliverable_id VARCHAR(50) REFERENCES client_deliverables(deliverable_id) ON DELETE SET NULL,
  current_version VARCHAR(20) DEFAULT 'v1.0',
  mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  file_size INT NOT NULL DEFAULT 0,
  checksum VARCHAR(64),
  storage_key VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'UPLOADED',
  visibility VARCHAR(50) DEFAULT 'INTERNAL',
  created_by VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_docs_lead_id ON documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_docs_visibility ON documents(visibility);

CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(50) NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  checksum VARCHAR(64),
  created_by VARCHAR(100) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_ver_id ON document_versions(document_id);

CREATE TABLE IF NOT EXISTS document_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
  project_id VARCHAR(50) REFERENCES projects(project_id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'REQUESTED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_req_lead ON document_requests(lead_id);
