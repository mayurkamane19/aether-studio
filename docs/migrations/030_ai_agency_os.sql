-- AETHER STUDIO — CRM PHASE 30 MIGRATION: ADVANCED AI AGENCY OPERATING SYSTEM 3.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  rec_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE CASCADE,
  module VARCHAR(50) DEFAULT 'CROSS_MODULE',
  category VARCHAR(50) DEFAULT 'ACTION',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  action_payload JSONB,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_rec_status ON ai_recommendations(status);
