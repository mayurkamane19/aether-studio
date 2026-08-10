-- AETHER STUDIO — CRM PHASE 43 MIGRATION: AI-NATIVE CLIENT EXPERIENCE & PERSONALIZATION 10.0
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE TABLE IF NOT EXISTS client_ai_queries (
  id SERIAL PRIMARY KEY,
  query_id VARCHAR(50) UNIQUE NOT NULL,
  lead_id INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  confidence_level VARCHAR(50) DEFAULT 'HIGH_CONFIDENCE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caq_leadid ON client_ai_queries(lead_id);
