-- AETHER STUDIO — CRM PHASE 36 MIGRATION: ADVANCED BUSINESS INTELLIGENCE & EXECUTIVE ANALYTICS 5.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS kpi_targets (
  id SERIAL PRIMARY KEY,
  target_id VARCHAR(50) UNIQUE NOT NULL,
  kpi_name VARCHAR(100) NOT NULL,
  target_value NUMERIC(12,2) NOT NULL,
  period VARCHAR(50) DEFAULT 'MONTHLY',
  owner VARCHAR(100) DEFAULT 'Executive',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kt_status ON kpi_targets(status);
