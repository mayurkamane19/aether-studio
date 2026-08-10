-- AETHER STUDIO — CRM PHASE 39 MIGRATION: ADVANCED INTEGRATIONS & ECOSYSTEM 7.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_id VARCHAR(50) UNIQUE NOT NULL,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  signature VARCHAR(255),
  status VARCHAR(50) DEFAULT 'PROCESSED',
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wl_provider ON webhook_logs(provider);
