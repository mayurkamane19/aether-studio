-- AETHER STUDIO — CRM PHASE 21 MIGRATION: EXECUTIVE COMMAND CENTER & ADVANCED BI
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_id VARCHAR(50) UNIQUE NOT NULL,
  period VARCHAR(50) NOT NULL,
  total_revenue NUMERIC(12,2) DEFAULT 0.00,
  won_leads INT DEFAULT 0,
  total_leads INT DEFAULT 0,
  open_pipeline NUMERIC(12,2) DEFAULT 0.00,
  snapshot_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snp_period ON analytics_snapshots(period);

CREATE TABLE IF NOT EXISTS analytics_alerts (
  id SERIAL PRIMARY KEY,
  alert_key VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(50) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON analytics_alerts(status);
