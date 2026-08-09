-- AETHER STUDIO — CRM PHASE 7 MIGRATION: ADVANCED CRM ANALYTICS INDEXES
-- Run this SQL script in your Supabase SQL Editor or PostgreSQL database console.

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_project_type ON leads(project_type);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC);
