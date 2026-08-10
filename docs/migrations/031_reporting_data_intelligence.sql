-- AETHER STUDIO — CRM PHASE 31 MIGRATION: ADVANCED REPORTING & DATA INTELLIGENCE 3.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS saved_reports (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'EXECUTIVE',
  query_config JSONB NOT NULL,
  owner VARCHAR(100) DEFAULT 'Admin',
  visibility VARCHAR(50) DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sr_cat ON saved_reports(category);
